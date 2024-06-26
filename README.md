# FB Crawl

## How to run

```sh
cp .env.example .env
docker-compose build
docker-compose up -d
```

## Check logs

```sh
# logs chrome
docker-compose logs chrome1 -f
docker-compose logs chrome2 -f

# logs worker
docker compose logs id-worker -f
docker compose logs detail-worker -f

# produce job
docker-compose exec exec board node dist/scripts/producers/post-id.js
docker-compose exec exec board node dist/scripts/producers/post-detail.js
```

## Crontab
```
0 0 * * * /usr/bin/docker compose -f /root/fb-crawler/docker-compose.yml exec board node dist/scripts/mark-expire-post.js >> /var/log/fb-crawl-expire.log

0 1,13 * * * /usr/bin/docker compose -f /root/fb-crawler/docker-compose.yml exec board node dist/scripts/producers/post-id.js >> /var/log/fb-crawl-id.log

0 2,14 * * * /usr/bin/docker compose -f /root/fb-crawler/docker-compose.yml exec board node dist/scripts/producers/like-page.js >> /var/log/fb-crawl-like-page.log

0 3,15 * * * /usr/bin/docker compose -f /root/fb-crawler/docker-compose.yml exec board node dist/scripts/producers/ads-id.js >> /var/log/fb-crawl-ads-id.log

0 4,16 * * * /usr/bin/docker compose -f /root/fb-crawler/docker-compose.yml exec board node dist/scripts/producers/post-detail.js >> /var/log/fb-crawl-detail.log

0 5,17 * * * /usr/bin/docker compose -f /root/fb-crawler/docker-compose.yml exec board node dist/scripts/producers/ads-detail.js >> /var/log/fb-crawl-ads-detail.log

```
