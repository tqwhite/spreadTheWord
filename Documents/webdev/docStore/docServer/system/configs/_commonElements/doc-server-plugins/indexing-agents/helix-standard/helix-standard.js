#!/usr/bin/env node
'use strict';

const moduleName = __filename.replace(__dirname + '/', '').replace(/.js$/, ''); //this just seems to come in handy a lot

const qt = require('qtools-functional-library');
//console.dir(qt.help());

const asynchronousPipePlus = new require('qtools-asynchronous-pipe-plus')();
const pipeRunner = asynchronousPipePlus.pipeRunner;
const taskListPlus = asynchronousPipePlus.taskListPlus;

const fs = require('fs');
const path = require('path');

const axios=require('axios');

//START OF moduleFunction() ============================================================

const moduleFunction = function(args = {}, callback) {
	const { xLog } = process.global;
	const { getConfig, indexingDatabase } = args;

	const { logDirectoryPath, hxConnectorUrl, description } = getConfig(`${moduleName}`);
	//--------------------------------------------------------------------------------
	//UTILITY FUNCTIONS

	const timeStamp = () => {
		const dt = new Date();
		const offset = dt.getTimezoneOffset();
		const dtOffset = new Date(dt.setMinutes(dt.getMinutes() - offset));
		const timeStamp = `${dtOffset.toISOString()}${-1 * offset / 60}`;
		return timeStamp;
	};

	//--------------------------------------------------------------------------------
	//INITIALIZE


	
	const logFilePath = path.join(logDirectoryPath, 'testLog.log');
	
	if (!fs.existsSync(logDirectoryPath)) {
		fs.mkdirSync(logDirectoryPath, { recursive: true });
	}
	
	if (!fs.existsSync(logFilePath)) {
		fs.appendFileSync(
			logFilePath,
			`${timeStamp()}: Initialized Log File for [${moduleName}] \n`
		);
	}
	

	const indexFunction = (logFilePath, hxConnectorUrl, timeStamp) => (args, callback) => {
		const {
			reportingModuleName,
			file,
			ds_uri,
			expressReq,
			requestObject
		} = args;

		const reportingObject = { ...requestObject, ds_uri, reportingModuleName };

		const opaqueData = Object.keys(requestObject)
			.filter(name => name.match(/^op_/))
			.map(name => ({ origName: name, revisedName: name.replace(/^op_/, '') }))
			.reduce((result, item) => {
				result[item.revisedName]=requestObject[item.origName];;
				return result;
			}, {});


		const helixData = {
			ds_uri,
			ds_refid: requestObject.ds_refid,
			ds_fileName: requestObject.ds_filepath?path.basename(requestObject.ds_filepath):'',
			...opaqueData
		};

		
		const url = hxConnectorUrl;

		axios({
			method: 'post',
			data: helixData,
			url,
			headers: { hello: 'goodbye' }
		})
			.then(function(response) {
				const loggingString = ` ${url} says "${response.data.status}" for ${
					requestObject.ds_operation
				} ${requestObject.ds_username}@(${requestObject.ds_mac})/(${
					requestObject.ds_requestingipaddress
				}):${requestObject.ds_uri ||
					requestObject.ds_filepath + ' into ' + ds_uri}`;

				xLog.status(
					`Indexing [${moduleName} ${logFilePath}]: ${timeStamp()}: ${loggingString}}`
				);
				fs.writeFileSync(logFilePath, loggingString);

				callback('', {
					moduleName,
					annotation: requestObject.filepath,
					ds_uri
				});
			})
			.catch(function(error) {
				const loggingString = ` ${requestObject.ds_operation} ${
					requestObject.ds_username
				}@(${requestObject.ds_mac})/(${
					requestObject.ds_requestingipaddress
				}):${requestObject.ds_uri ||
					requestObject.ds_filepath + ' into ' + ds_uri}`;
				xLog.status(
					`Indexing ERROR [${moduleName} ${logFilePath}]: ${timeStamp()}: ${url} says "${error.toString()}" for ${loggingString}}`
				);

				callback(error.toString(), {
					moduleName,
					annotation: requestObject.filepath,
					ds_uri
				});
			});
	};
	
	const getLogDataRecipient=(moduleName, callback)=>indexingDatabase.getTable(moduleName, callback)

	//--------------------------------------------------------------------------------
	//ACTUAL LOGGING FUNCTION [index()] is called from file-storage/engine/ENGINENAME.js
	const taskList = new taskListPlus();

	taskList.push((args, next) => {
		const { description } = args;
		const startupInfo = () => {
			const stats = fs.statSync(logFilePath);
			return `${description}; helix post results logged at ${logFilePath}`;
	};
		next('', { ...args, startupInfo });
	});

	taskList.push((args, next) => {
		const { logDataRecipient, timeStamp } = args;

		const index = indexFunction(logFilePath, hxConnectorUrl, timeStamp);

		next('', { ...args, index });
	});

	const initialData = { logFilePath, hxConnectorUrl, description, timeStamp };
	pipeRunner(taskList.getList(), initialData, (err, args) => {
		const { index, startupInfo } = args;

		callback('', { index, startupInfo, agentName: moduleName });
	});
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();
//moduleFunction().workingFunction().qtDump();

