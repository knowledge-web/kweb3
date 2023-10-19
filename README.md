# Start

```sh
npx serve
npx livereload # optional
```

# Deploy

```
# Note to self
rsync -avL --progress --exclude .git --exclude brain ./kweb3 cloud:
# maybe remove the -L above... brain (the link) isn't copied anymore
rsync -av --progress --exclude '.git' --exclude 'Brain' ./kweb-data cloud:
```
