var alerter = require("./Alert.js");
var fs = require('fs');
var path = require("path");
var readBatFile = require("./readBatchbatfile.js");
var request = require('request');
var batc_bat_name = 'D:/Customer_Blast_to_Asc/Blast Batch 200 YmdHms.bat';
///module variables and constants///////////////////////////////////////////////////////////////////////////////////////
var rootDir;
var konyvtar;
var lastkonyvtar;
var timeSeconds;
var emails;
var kuszob;
var currentFilePath;
var lastModifiedFileDateTime;
var lastModifiedFileSize;
var previousLastModifiedDateTime;
var previousLastModifiedFileSize;
var writeFirst = false;
var restartSuccess = true;
checkDataAcquisition();
///data sender wrapper function/////////////////////////////////////////////////////////////////////////////////////////
function checkDataAcquisition() {
    var timer = fs.readFileSync('config.txt', "utf-8").toString().split('\n');
    timeSeconds = timer[1].slice(8, timer[1].length);
    rootDir = timer[2].slice(12, timer[2].length);
    kuszob = parseInt(timer[3].slice(15, timer[3].length));
    emails = timer[4].slice(13, timer[4].length);
    konyvtar = readBatFile.readbatfile(batc_bat_name);
    if (writeFirst == true) {
        restartWasSuccesfull();
        if(restartSuccess == false){
            restartAcquisition();
        }
        console.log(restartSuccess);
    }
    if (konyvtar == null ){
        fs.appendFileSync('error_log.txt', 'Nincs bat fájl a könyvtárban: ' + '\n', function (err, data) {
            if (err) {
                return console.log(err);
            }
        });
        //console.log("nincs ilyen könyvtár");
        console.log("++nem jött létre bat fájl");
        restartAcquisition();
        //checkDataAcquisition();
    }
    else if (restartSuccess == true){
        currentFilePath = rootDir.trim() + '/' + konyvtar;
        console.log(currentFilePath);
        lastkonyvtar = konyvtar;
        if (getLastCreatedDataFileName() == null) {
            //console.log(currentFilePath+" ?könyvtár nem létezik");
            restartAcquisition();
            //checkDataAcquisition();
        }
        else {
            console.log(currentFilePath + "/" + getLastCreatedDataFileName());
//        process.exit();
            var stat = fs.statSync(currentFilePath + "/" + getLastCreatedDataFileName());
            previousLastModifiedDateTime = lastModifiedFileDateTime;
            previousLastModifiedFileSize = lastModifiedFileSize;
            lastModifiedFileSize = stat.size;
            lastModifiedFileDateTime = stat.mtime.toISOString().replace(/T/, ' ').// replace T with a space
            replace(/\..+/, '');
            console.log("a fájl mérete: " + lastModifiedFileSize + " byte" + "\nlegutoljára módosítás dátuma : " + lastModifiedFileDateTime);
            if (writeFirst == true) {
                fs.appendFile('error_log.txt', 'Adatgyűjtés újraindítása után első futási eredmények: ' + currentFilePath + "/" + getLastCreatedDataFileName() + '\n', function (err, data) {
                    if (err) {
                        return console.log(err);
                    }
                });
                writeFirst = false;
            }
            /*        request({
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
             });*/
            compareFileParameters();
        }
        //
    }
    setTimeout(function () {
        checkDataAcquisition();
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
function restartWasSuccesfull() {
    var fileType=".fw4";
    var temp = [];
    if ( lastkonyvtar == konyvtar && konyvtar != null) {
        console.log("nem sikerült az újraindítás mert ugyanaz a könyvtár vagy a bat fájl rossz");
        fs.appendFileSync('error_log.txt', 'Sikertelen újraindítás: ' + '\n', function (err, data) {
            if (err) {
                return console.log(err);
            }
        });
        console.log("lastkonyvtar: "+lastkonyvtar +"\n"+"aktkonyvtar: "+konyvtar);
        restartSuccess=false;
        return restartSuccess;
    } else {
        konyvtar= readBatFile.readbatfile(batc_bat_name);
        currentFilePath = rootDir.trim() + '/' + konyvtar;
        if (fs.existsSync(currentFilePath)) {
        var list = fs.readdirSync(currentFilePath);
        // létezik-e fájl a könyvtárban
        //console.log(list);
        if (list.length != 0) {
            for (var i = 0; i < list.length; i++) {
                if (path.extname(list[i]) === fileType) {
                    temp.push(list[i]);
                }
            } // end for
            var last_element = temp[temp.length - 1];
            var stat = fs.statSync(currentFilePath + "/" + last_element);
            console.log(stat.size);
            if(stat.size > 1000){
                console.log("sikeres restart");
                restartSuccess=true;
                return restartSuccess;}
            else{
                console.log("sikertelen restart");
                restartSuccess=false;
                return restartSuccess;
            } // létrejött fájl vizsgálatának vége
        } // ha jött léter fájl vizsgálatának vége
             else if(list.length == 0) {
            console.log("Sikertelen újraindítás nincs fájl a létrejött könyvtárstruktúrában!");
            fs.appendFileSync('error_log.txt', ' Sikertelen újraindítás Nincs fájl a könyvtárban: ' + currentFilePath + '\n', function (err, data) {
                if (err) {
                    return console.log(err);
                }
            });
            console.log("++");
            //restartAcquisition();

            restartSuccess=false;
            return restartSuccess;
        } // nem jött létre fájl
        // end for loop
        return (temp[temp.length - 1]);
    } else{
        console.log("There is no directory such as: "+currentFilePath);
        }
    }
}


//getLastModifiendFileName
function getLastCreatedDataFileName() {
    var fileType = '.fw4'; //file extension
    var temp = [];
    if (fs.existsSync(currentFilePath)) {
        var list = fs.readdirSync(currentFilePath);
        if (list.length != 0) {
            for (var i = 0; i < list.length; i++) {
                if (path.extname(list[i]) === fileType) {
                    temp.push(list[i]);
                }
            }
        } else if(list.length ==0) {
            console.log("Nincsen .fw4 fájl a könyvtárban");
            fs.appendFileSync('error_log.txt', 'Nincs fájl a könyvtárban: ' + currentFilePath + '\n', function (err, data) {
                if (err) {
                    return console.log(err);
                }
            });
            return null;
        }
        // end for loop
        return (temp[temp.length - 1]);
    } else {
        console.log("Nem létezik ilyen könyvtár a fájlok keresésére.");
        fs.appendFileSync('error_log.txt', 'Nem létezeik ilyen könyvtár a fájlok keresésére: ' + currentFilePath+ '\n', function (err, data) {
            if (err) {
                return console.log(err);
            }
        });
        //   console.log("nincs ilyen directory");
        return null;
    }
}

function restartAcquisition(callback) {
    //console.log("restart call");
    require('child_process').exec("restart2.bat", function (err, stdout, stderr) {
        if (err) {
            // Ooops.
            console.log(stderr);
            return console.log(err);
        }
        // Done.
        console.log(stdout);
    });
    writeFirst = true;
}
/*  var datum = new Date().toISOString().replace(/T/, ' ').      // replace T with a space
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


 } */