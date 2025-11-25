sudo rm -rf /usr/local/go && wget https://go.dev/dl/go1.24.0.linux-amd64.tar.gz && sudo tar -C /usr/local -xzf go1.24.0.linux-amd64.tar.gz
if ! grep -q '/usr/local/go/bin' ~/.bashrc; then
    echo 'export PATH=$PATH:$HOME/go/bin:/usr/local/go/bin' >> ~/.bashrc
fi
rm -rf go1.24.0.linux-amd64*
export PATH=$PATH:$HOME/go/bin:/usr/local/go/bin
go version
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm install 20
node -v
npm -v
nvm use 20
nvm alias default 20
sudo rm -rf /etc/nginx/sites-enabled/app.conf
sudo cp app.conf /etc/nginx/sites-enabled/app.conf
sudo rm -rf /etc/nginx/sites-enabled/api.conf
sudo cp api.conf /etc/nginx/sites-enabled/api.conf
sudo systemctl restart nginx