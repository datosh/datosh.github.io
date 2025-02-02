#!/bin/bash

./fetch_goinvaders.sh

if [ "$CF_PAGES_BRANCH" == "main" ]; then
  hugo --baseURL $CF_PAGES_URL
else
  hugo --baseURL $CF_PAGES_URL --buildDrafts --buildFuture
fi
