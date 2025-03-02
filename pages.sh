#!/bin/bash

./fetch_goinvaders.sh

if [ "$CF_PAGES_BRANCH" == "main" ]; then
  hugo --baseURL blog.kammel.dev
else
  hugo --baseURL $CF_PAGES_URL --buildDrafts --buildFuture
fi
