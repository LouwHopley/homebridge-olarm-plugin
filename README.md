# homebridge-olarm-plugin

This plugin creates a HomeKit interface for an [Olarm](https://olarm.co) alarm system.

## Guide

### Setting up for development

1. Clone the repo onto your device that hosts your Homebridge instance.
2. Run `npm install` to install dependencies.
3. Run `npm run watch` to have `nodemon` run and keep it updated. It also runs `npm link`.

**Now to plug it into your Homebridge**

1. Run `npm run build` to build the plugin into `/dist` (`npm run watch` will do the same)
2. Run `pwd` to get the full path to the plugin (e.g. `/home/pi/HomebridgePlugins/olarm-plugin`)
3. Inside Homebridge's directory, Run `npm link` if needed `sudo npm link <path from step 2>`
3. Update the Homebridge `config.json` with this platform:
```
{
  "platform": "OlarmHomebridgePlugin",
  "name": "homebridge-olarm-plugin",
  "apiKey": "test-api-key"
}
```
4. Restart your Homebridge `sudo systemctl restart homebridge`


