//This module provides the directory where all the fw4 files are being kept!
var fs = require('fs');
var restartAcq = require ('./restartAcquisition');
var filename = 'D:/Customer_Blast_to_Asc/Blast Batch 200 YmdHms.bat';
//var file = readBatfile(filename);
//console.log(file);
function readBatfile(filename) {
    if (fs.existsSync(filename)) {
        var data = fs.readFileSync(filename, "utf-8");
        var tomb = data.toString().split('\n');
        if (tomb.length == 16) {
            var index = tomb.length - 2;
            var temporarydir = tomb[index];
            var eqindex = temporarydir.indexOf('2');
            var finaldirectory = temporarydir.substring(eqindex, 42);
            return finaldirectory;
        } /*else{
            fs.appendFileSync('error_log.txt','A bat fájl nem helyesen jött létre: '+'\n', function (err,data) {
                if (err) {
                    return console.log(err);
                }
            });
            // console.log("valami gáz van");

            return false;
        }*/
    } else {
        fs.appendFileSync('error_log.txt', 'valami gáz van a bat file-lal. ' + '\n', function (err, data) {
            if (err) {
                return console.log(err);
            }
        });
        //console.log("nincs ilyen könyvtár");
        console.log("++nem jött létre bat fájl");
       // console.log("nincs ilyen file");
        return null;
    }

}
module.exports.readbatfile = readBatfile;