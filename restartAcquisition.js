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
