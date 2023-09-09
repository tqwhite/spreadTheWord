
Installation and management commands for target server /Users/tqwhite/Documents/webdev/docStore/docServer/system/

ln -s /home/staticSiteData/sites/scoreRummy.com/system/configs/systemConfigsLib/nginx/scoreRummy.com.conf /etc/nginx/sites-enabled/scoreRummy.com.conf

sudo systemctl restart nginx.service

also...


sudo echo -e "\n127.0.0.1 scoreRummy.local" >> /etc/hosts

