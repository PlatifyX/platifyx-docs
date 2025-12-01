sudo docker-compose down
sudo docker system prune -a -f
sudo docker-compose up -d
sudo rm -rf /etc/nginx/sites-enabled/app.conf
sudo cp app.conf /etc/nginx/sites-enabled/app.conf
sudo rm -rf /etc/nginx/sites-enabled/api.conf
sudo cp api.conf /etc/nginx/sites-enabled/api.conf
sudo systemctl restart nginx