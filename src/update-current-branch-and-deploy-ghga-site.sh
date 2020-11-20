#!/bin/bash

set -uvex

siteRepo=/root/ghga-de
cd "$siteRepo"
echo "############################################################################" >> /dev/stderr
echo "## Is the right branch checked out? PLEASE CHECK                          ##" >> /dev/stderr
echo "############################################################################" >> /dev/stderr
git branch --list
sleep 10
git pull
bundle exec jekyll build
rsync -avuc --delete "$siteRepo/_site/" /var/www/html/
chmod a+rX -R /var/www/html/
