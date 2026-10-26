#!/usr/bin/env bash
# 把网站发布到 wordpress-server（内网 172.27.235.198），经 panel.uswoo.cn 中转。
#
# 发布的是当前 HEAD 的已提交内容（git archive），不含工作区未提交的改动。
# 只上传页面实际用到的文件：index.html、menu.html、css/、js/，以及被页面/脚本/样式
# 按文件名引用到的 assets/ 文件；README、DESIGN、.github 和没用到的图片都不上传。
#
# 用法：scripts/deploy.sh            发布
#       scripts/deploy.sh --dry-run  只列出将上传的文件
set -euo pipefail

JUMP_HOST="panel.uswoo.cn"
TARGET="root@172.27.235.198"
SITE_DIR="/data/sites/teabytheseaboston.com"
CONTROL_PATH="/tmp/cc-uswoo-ssh"   # 与 uswoo_portal 共用，避免 SSH 频率限流

cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

if [[ -n "$(git status --porcelain -- index.html menu.html css js assets)" ]]; then
  echo "⚠️  网站文件有未提交的改动，这些改动不会被发布（发布的是 HEAD）。" >&2
fi

files=(index.html menu.html $(git ls-files css js))
pages=(index.html menu.html $(git ls-files css js))
while IFS= read -r f; do
  if grep -qF "$(basename "$f")" "${pages[@]}"; then
    files+=("$f")
  fi
done < <(git ls-files assets)

if [[ "${1:-}" == "--dry-run" ]]; then
  printf '%s\n' "${files[@]}"
  echo "共 ${#files[@]} 个文件"
  exit 0
fi

rev="$(git rev-parse --short HEAD)"
echo "发布 $rev（${#files[@]} 个文件）→ $TARGET:$SITE_DIR"

# 先解压到临时目录，再整体换上去，旧版本保留为 .prev 便于回滚：
#   mv $SITE_DIR $SITE_DIR.bad && mv $SITE_DIR.prev $SITE_DIR
remote_script="set -e
new=\"$SITE_DIR.new\"; prev=\"$SITE_DIR.prev\"
rm -rf \"\$new\"; mkdir -p \"\$new\"
tar -xf - -C \"\$new\"
echo $rev > \"\$new/.revision\"
chown -R apache:apache \"\$new\"
find \"\$new\" -type d -exec chmod 755 {} +
find \"\$new\" -type f -exec chmod 644 {} +
rm -rf \"\$prev\"
if [ -d \"$SITE_DIR\" ]; then mv \"$SITE_DIR\" \"\$prev\"; fi
mv \"\$new\" \"$SITE_DIR\"
echo \"已发布：\$(cat $SITE_DIR/.revision)，\$(find $SITE_DIR -type f | wc -l) 个文件\""

git archive --format=tar HEAD -- "${files[@]}" |
  ssh -o ControlMaster=auto -o ControlPath="$CONTROL_PATH" -o ControlPersist=45m "$JUMP_HOST" \
    "ssh -o BatchMode=yes $TARGET $(printf '%q' "$remote_script")"
