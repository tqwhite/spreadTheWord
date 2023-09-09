


ln -s /Users/tqwhite/Documents/webdev/docStore/docServer/system//configs/instanceSpecific/qbook/systemConfigsLib/nginx/scoreRummy.com.conf /Users/tqwhite/Documents/webdev/qbook/qbook.local/nginx_main/configs/servers/ 

brew services restart nginx


also...


sudo echo -e "127.0.0.1 scoreRummy.local" >> /etc/hosts

(actually, MacOS won't allow this. it must be edited from the UI.)
