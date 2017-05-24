////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///DaqMonitoring Core module////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///required modules/////////////////////////////////////////////////////////////////////////////////////////////////////
var alerter = require("./Alert.js");
var fs = require('fs');
var path = require("path");
var readBatFile = require("./readBatchbatfile.js");
var request = require('request');
var batc_bat_name= 'D:/Customer_Blast_to_Asc/Blast Batch 200 YmdHms.bat';
///module variables and constants///////////////////////////////////////////////////////////////////////////////////////
//var rootDir = 'D:/Customer_Blast_to_Asc';
var rootDir;
var konyvtar;
var timeSeconds;
var emails;
var kuszob;
var currentFilePath;
var lastModifiedFileDateTime;
var lastModifiedFileSize;
var previousLastModifiedDateTime;
var previousLastModifiedFileSize;
var writeFirst =false;
checkDataAcquisition();
///data sender wrapper function/////////////////////////////////////////////////////////////////////////////////////////
function checkDataAcquisition() {
                var timer= fs.readFileSync('config.txt', "utf-8").toString().split('\n');
                timeSeconds = timer[1].slice(8,timer[1].length);
                rootDir = timer[2].slice(12,timer[2].length);
                kuszob = parseInt(timer[3].slice(15,timer[3].length));
                emails = timer[4].slice(13,timer[4].length);
                konyvtar = readBatFile.readbatfile(batc_bat_name);
                //currentFilePath = rootDir;
                currentFilePath = rootDir.trim()+'/'+konyvtar;
                //console.log(currentFilePath);
                console.log(currentFilePath+"/"+getLastCreatedDataFileName());
                var stat = fs.statSync(currentFilePath+"/"+getLastCreatedDataFileName());
                previousLastModifiedDateTime = lastModifiedFileDateTime;
                previousLastModifiedFileSize = lastModifiedFileSize;
                lastModifiedFileSize = stat.size;
                lastModifiedFileDateTime= stat.mtime.toISOString().
                    replace(/T/, ' ').      // replace T with a space
                    replace(/\..+/, '');
                console.log("a fájl mérete: "+  lastModifiedFileSize+" byte" + "\nlegutoljára módosítás dátuma : "+lastModifiedFileDateTime);
        	    if(writeFirst == true){
                fs.appendFile('error_log.txt','Adatgyűjtés újraindítása után első futási eredmények: '+ currentFilePath+"/"+getLastCreatedDataFileName()+'\n', function (err,data) {
                if (err) {
                    return console.log(err);
                }
            });
            writeFirst =false;
	        }
            request({
            uri: "http://nyme.ggki.hu/dataSavers/saveIntoDatabase.php",
            method: "POST",
            form: {
		        konyvtar: konyvtar,
                currentFilePath: konyvtar+'/'+getLastCreatedDataFileName(),
                lastModifiedFileSize:lastModifiedFileSize,
                lastModifiedFileDateTime: lastModifiedFileDateTime
        }
    }, function (error, response, body) {
        //console.log(body);
    });
            setTimeout(function () {
                checkDataAcquisition();
                compareFileParameters();
                }, timeSeconds);
}
function compareFileParameters() {
    var date = new Date().toISOString().
    replace(/T/, ' ').      // replace T with a space
    replace(/\..+/, '');
    if(previousLastModifiedFileSize == lastModifiedFileSize){
        fs.appendFile('error_log.txt',date+': Adatgyűjtés leállt, újraindítási kísérlet. Utolsó adatfájl : '+ currentFilePath+"/"+getLastCreatedDataFileName()+'\n', function (err,data) {
            if (err) {
                return console.log(err);
            }
        });
        restartAcquisition();
    }
}
//getLastModifiendFileName
function getLastCreatedDataFileName() {
    var fileType = '.fw4'; //file extension
    var temp = [];
    var list = fs.readdirSync(currentFilePath);
    for (var i = 0; i < list.length; i++) {
        if(path.extname(list[i])===fileType) {
            temp.push(list[i]);
        }
    } return (temp[temp.length-1]);
    // end for loop
}

function restartAcquisition(callback) {
    console.log("restart call");
    require('child_process').exec("restart.bat", function (err, stdout, stderr) {
        if (err) {
            // Ooops.
            console.log(stderr);
            return console.log(err);
        }
        // Done.
        console.log(stdout);
    });
	var datum = new Date().toISOString().replace(/T/, ' ').      // replace T with a space
    replace(/\..+/, '');
    var lastfile = getLastCreatedDataFileName();
    lastfile = parseInt(lastfile.substr(0,lastfile.indexOf(".")));
    if(lastfile>kuszob){
        request({
            uri: "http://nyme.ggki.hu/dataSavers/saveIntoDatabaseSuccessRestart.php",
            method: "POST",
            form: {
                lastModifiedFile: currentFilePath+"/"+getLastCreatedDataFileName(),
                date: datum
            }
        }, function (error, response, body) {
            //  console.log(body);
        });
    }else{
        request({
            uri: "http://nyme.ggki.hu/dataSavers/saveIntoDatabaseRestart.php",
            method: "POST",
            form: {
                lastModifiedFile: currentFilePath+"/"+getLastCreatedDataFileName(),
                date: datum
            }
        }, function (error, response, body) {
            //  console.log(body);
        });
        alerter.sendEmail();
    }

    writeFirst = true;
}