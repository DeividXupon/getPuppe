const puppeteer = require('puppeteer');
const WebSocket = require('ws');
const { exec } = require('child_process');

const PORT = 8080;
const wsServer = new WebSocket.Server({ port: PORT });

function userNotLoggedIn() {
    console.log("Nova janela de login do Google detectada!");

    setTimeout(async () => {
        exec('xdotool search --name "login" windowactivate key Tab Tab Return', (error, stdout, stderr) => {
            if (error) {
                console.error(`Erro ao executar xdotool: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Erro do xdotool: ${stderr}`);
                return;
            }
            console.log(`Saída do xdotool: ${stdout}`);
        });
    }, 2000);
}

wsServer.on('connection', (ws) => {
    console.log('Conectado ao WebSocket.');
    ws.on('message', async (message) => {
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        try {
            const browser = await puppeteer.launch({
                headless: false,
                userDataDir: '/home/deivid/.config/google-chrome',
                args: [
                    '--start-maximized',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled'
                ]
            });

            const page = await browser.newPage();
            const { width, height } = await page.evaluate(() => ({
                width: window.screen.width - 300,
                height: window.screen.height - 300
            }));
            await page.setViewport({ width, height });

            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => false,
                });
            });

            await page.goto('https://www.binance.com/pt-BR/my/dashboard');

            if (page.url().includes('login')) {
                await page.hover('#googleLoginBtn');
                console.log("Mouse movido para o botão '#googleLoginBtn'!");
                await page.click('#googleLoginBtn')
                console.log("Nova janela de login do Google detectada!");

                await new Promise((resolve) => {
                    setTimeout(() => {
                        exec('xdotool search --name "login" windowactivate key Tab Tab Return', (error, stdout, stderr) => {
                            if (error) {
                                console.error(`Erro ao executar xdotool: ${error.message}`);
                                resolve();
                                return;
                            }
                            if (stderr) {
                                console.error(`Erro do xdotool: ${stderr}`);
                                resolve();
                                return;
                            }
                            console.log(`Saída do xdotool: ${stdout}`);
                            resolve();
                        });
                    }, 3000);
                });

                await delay(6000);

                const checkbox = await page.$('div[role="checkbox"]');
                if (checkbox) {
                    await checkbox.click();
                    console.log("Checkbox clicado!");
                } else {
                    console.log("Checkbox não encontrado!");
                }

                const button = await page.$('button.bn-button.bn-button__primary');
                if (button) {
                    await button.click();
                    console.log("Botão clicado!");
                } else {
                    console.log("Botão não encontrado!");
                }
                
                await delay(5000);

                if (page.url().includes('login')) {
                    console.log("Página de login ainda aberta!");
                    ws.send(JSON.stringify({
                        success: false,
                        message: 'Login pelo google travou muitas tentativas.'
                    }));
                    ws.close();
                    browser.close();
                }

                ws.send(JSON.stringify({
                    success: true,
                    reTry: true,
                    message: 'Login realizado com sucesso!'
                }));
                ws.close();
                browser.close();
            }

            await page.waitForSelector('button.deposit-btn');
            await page.click('button.deposit-btn');
            console.log("Botão 'Depositar' clicado!");

            await page.waitForSelector('#deposit-drawer-scrollable > div.bn-flex.flex-col.deposit-drawer-scrollable.gap-6 > div:nth-child(1) > div:nth-child(2)');
            await page.click('#deposit-drawer-scrollable > div.bn-flex.flex-col.deposit-drawer-scrollable.gap-6 > div:nth-child(1) > div:nth-child(2)');
            console.log("Elemento 'BRL' clicado!");

            await page.waitForSelector('img[alt="Transferência Bancária (PIX)"]');
            await delay(1000);
            await page.click('img[alt="Transferência Bancária (PIX)"]');
            await delay(1000);
            await page.click('img[alt="Transferência Bancária (PIX)"]');
            await delay(1000);
            await page.click('img[alt="Transferência Bancária (PIX)"]');
            console.log("Elemento 'pix' clicado!");

            await page.waitForSelector('button.bn-button.bn-button__primary:has(span):not([disabled])');
            setTimeout(() => {
                page.click('button.bn-button.bn-button__primary:has(span):not([disabled])');
            }, 1000);
            console.log("Elemento 'continuar' clicado!");

            await page.waitForSelector('button[data-bn-type="button"]');
            await page.click('button[data-bn-type="button"]');
            console.log("Elemento 'Criar uma Nova Ordem' clicado!");

            await page.waitForSelector('input[inputmode="decimal"]');
            await page.type('input[inputmode="decimal"]', message.toString(), { delay: 100 });
            console.log("Texto digitado!");

            await page.waitForSelector('#fiat-app button:not([disabled])');
            await page.click('#fiat-app button:not([disabled])');
            console.log("Elemento 'Continuar' clicado!");

            await page.waitForSelector('img[src^="data:image/"]');
            await page.waitForSelector('#fiat-app div.overflow-y-auto div.bn-flex.relative.flex-col.border > div > div > div:not([class]) > div');
            const textPix = await page.evaluate(() => {
                const el = document.querySelector('#fiat-app div.overflow-y-auto div.bn-flex.relative.flex-col.border > div > div > div:not([class]) > div');
                return el ? el.innerText : null;
            });
            
            //const response = await axios.post('http://localhost:8000/api/rota', { keyPix: dataURLs });
            //console.log("Resposta da API:", response.data);

            console.log("Texto copiado!" + textPix);
            ws.send(JSON.stringify({
                success: true,
                data: textPix,
            }));

            browser.close();
            ws.close();

            console.log("Conexão WebSocket fechada.");
        } catch (error) {
            console.error('Erro ao processar a página:', error);
            ws.close();
        }
    });
});

console.log(`Servidor WebSocket rodando na porta ${PORT}`);
