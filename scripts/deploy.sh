#!/usr/bin/env bash
# 本地打包 Vue 官网，经 panel.uswoo.cn（Vectra 后端服务器）中转，发布到 wordpress-server（内网 172.27.235.198）。
#
# 发布的是当前 HEAD 的已提交代码：先把 HEAD 导出到临时目录再打包，工作区里没提交的改动不会带上。
# 打包前从线上 /content/site.json 拉取 CMS 已发布的内容快照做预渲染；CMS 还没上线时用 --legacy-content。
# 内容快照本身由 Vectra CMS 发布任务写到 $SITE_DIR-content/，这里不碰。
#
# 用法：scripts/deploy.sh                    发布
#       scripts/deploy.sh --legacy-content   用 content/legacy-snapshot.json 预渲染
#       scripts/deploy.sh --dry-run          只打包并列出将上传的文件
# 回滚：ssh 到服务器执行 mv $SITE_DIR $SITE_DIR.bad && mv $SITE_DIR.prev $SITE_DIR
set -euo pipefail

JUMP_HOST="panel.uswoo.cn"
TARGET="root@172.27.235.198"
SITE_DIR="/data/sites/teabytheseaboston.com"
CONTROL_PATH="/tmp/cc-uswoo-ssh"   # 与 uswoo_portal 共用，避免 SSH 频率限流
SITE_IP="47.89.231.163"

dry_run=false
content_mode=""
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=true ;;
    --legacy-content) content_mode="--legacy" ;;
    *) echo "未知参数：$arg" >&2; exit 2 ;;
  esac
done

repo="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
cd "$repo"
if [[ -n "$(git status --porcelain -- src public index.html vite.config.ts package.json pnpm-lock.yaml content)" ]]; then
  echo "⚠️  有未提交的改动，这些改动不会被发布（发布的是 HEAD）。" >&2
fi
rev="$(git rev-parse --short HEAD)"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
git archive --format=tar HEAD | tar -xf - -C "$work"
ln -s "$repo/node_modules" "$work/node_modules"

(
  cd "$work"
  node scripts/fetch-content.mjs $content_mode
  pnpm exec vite-ssg build >/dev/null
  # 只留页面实际引用到的图片（public/assets 里还有不少原图），引用包括预渲染 HTML、打包的 js/css 和内容快照
  refs="$(cat dist/*.html dist/assets/*.js dist/assets/*.css src/content/fallback.json)"
  find dist/assets/img dist/assets/svg -type f | while read -r f; do
    grep -qF "${f#dist}" <<<"$refs" || rm "$f"
  done
  find dist -type d -empty -delete
)

files="$(cd "$work/dist" && find . -type f | sort)"
if $dry_run; then
  echo "$files"
  echo "共 $(wc -l <<<"$files" | tr -d ' ') 个文件，$(du -sh "$work/dist" | cut -f1)"
  exit 0
fi

echo "发布 $rev（$(wc -l <<<"$files" | tr -d ' ') 个文件，$(du -sh "$work/dist" | cut -f1)）→ $TARGET:$SITE_DIR"

# 先解压到临时目录，再整体换上去，旧版本保留为 .prev 便于回滚
remote_script="set -e
new=\"$SITE_DIR.new\"; prev=\"$SITE_DIR.prev\"
rm -rf \"\$new\"; mkdir -p \"\$new\" \"$SITE_DIR-content\"
tar -xf - -C \"\$new\"
echo $rev > \"\$new/.revision\"
chown -R apache:apache \"\$new\"
find \"\$new\" -type d -exec chmod 755 {} +
find \"\$new\" -type f -exec chmod 644 {} +
rm -rf \"\$prev\"
if [ -d \"$SITE_DIR\" ]; then mv \"$SITE_DIR\" \"\$prev\"; fi
mv \"\$new\" \"$SITE_DIR\"
echo \"已发布：\$(cat $SITE_DIR/.revision)，\$(find $SITE_DIR -type f | wc -l) 个文件\""

COPYFILE_DISABLE=1 tar --no-xattrs -C "$work/dist" -cf - . |
  ssh -o ControlMaster=auto -o ControlPath="$CONTROL_PATH" -o ControlPersist=45m "$JUMP_HOST" \
    "ssh -o BatchMode=yes $TARGET $(printf '%q' "$remote_script")"

# 上线自检（直连服务器 IP，不受本机 DNS 缓存影响）
fail=0
for path in / /menu /privacy /terms /menu.html /no-such-page; do
  code="$(curl -s -o /dev/null -w '%{http_code}' --resolve "teabytheseaboston.com:443:$SITE_IP" "https://teabytheseaboston.com$path")"
  case "$path" in
    /menu.html) want=301 ;;
    /no-such-page) want=404 ;;
    *) want=200 ;;
  esac
  printf '  %-14s %s %s\n' "$path" "$code" "$([[ $code == "$want" ]] && echo ✓ || echo "✗ 期望 $want")"
  [[ $code == "$want" ]] || fail=1
done
exit $fail
