#!/usr/bin/env node
'use strict';

const moduleName = __filename.replace(__dirname + '/', '').replace(/.js$/, ''); //this just seems to come in handy a lot

const qt = require('qtools-functional-library'); //qt.help({printOutput:true, queryString:'.*', sendJson:false});

const commandLineParser = require('qtools-parse-command-line');
const configFileProcessor = require('qtools-config-file-processor');

//get config file data
const path = require('path');
const fs = require('fs');
const os = require('os');
const projectRoot = fs.realpathSync(path.join(__dirname, '..', '..')); // adjust the number of '..' to fit reality
const configName = os.hostname() == 'qMax.local' ? 'qbook' : '${configDirName}';

const configDirPath = `${projectRoot}/configs/instanceSpecific/${configName}/`;
const config = configFileProcessor.getConfig(
	'systemParameters.ini',
	configDirPath
);

const commandLineParameters = commandLineParser.getParameters();

// spreadTheWord  --distribution=helixBackup "hello from spread the word"

//START OF moduleFunction() ============================================================

const moduleFunction = ({ config, commandLineParameters, moduleName } = {}) => (
	args = {}
) => {
	const localConfig = config[moduleName];
	if (
		commandLineParameters.fileList.length != 1 ||
		typeof commandLineParameters.fileList[0] != 'string'
	) {
		console.log(
			`There must be a string in the command line, eg,\ntqtxt "this is a text"\n\n`
		);
		return;
	}

	const { twilioParms, distributions, defaultDistributionName=''} = localConfig;

	let distributionName = commandLineParameters
		.qtGetSurePath('values.distribution', [])
		.qtPop();
	
	if (!distributionName) {
		distributionName = defaultDistributionName;
	}

	if (!distributionName) {
		console.log(
			`There must be a distribution in the command line, eg,\n--distribution=BLAH\nAvailable distributions: ${Object.keys(
				distributions
			).join(', ')}`
		);
		return;
	}


	const distribution = distributions[distributionName];
	
	if (!distribution || !distribution.length){
		console.log(
			`Bad distribution name. ${distributionName} was not found`
		);
		return;
	}
	
	distribution.forEach(receivingPhoneNumber => {
		const { accountSid, authToken, tqTwilioSourcePhone } = twilioParms;
		const client = require('twilio')(accountSid, authToken);
		client.messages
			.create({
				body: commandLineParameters.fileList[0],
				from: `+1${tqTwilioSourcePhone}`,
				to: `+1${receivingPhoneNumber}`
			})
			.then(message =>
				console.log(
					`message was sent to ${receivingPhoneNumber} (sid='${message.sid}')`
				)
			);
	});
	
	return this;
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction({
	config,
	commandLineParameters,
	moduleName
})();

