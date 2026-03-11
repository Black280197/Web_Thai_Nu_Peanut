#!/bin/bash

repoPath=$(dirname "$0")

echo "=== Auto Git Pull ==="
echo "Repo: $repoPath"
echo "Chu ky: 60 giay"
echo ""

while true
do
  timestamp=$(date +"%H:%M:%S")
  echo -n "[$timestamp] git pull..."

  result=$(git -C "$repoPath" pull 2>&1)

  if [[ "$result" == "Already up to date." ]]; then
    echo " Khong co gi moi."
  else
    echo ""
    echo "$result"
  fi

  sleep 60
done