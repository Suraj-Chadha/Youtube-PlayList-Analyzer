const puppeteer = require("puppeteer");
const pdfkit = require('pdfkit');
const fs = require("fs");
const minimist = require("minimist");

let args = minimist(process.argv);

let cTab;
let link = args.link;

(async function(){
    try{
        let browserOpen = puppeteer.launch({
            headless:false,
            defaultViewport:null,
            args:['--start-maximized'],
        })

        let browserInstance = await browserOpen;
        let allTabsArr = await browserInstance.pages();
        cTab = allTabsArr[0];
        await cTab.goto(link);
        await cTab.waitForSelector('h1#title');
        let name = await cTab.evaluate(function(select){return document.querySelector(select).innerText},'h1#title');
        console.log(name);
        let allDataObj = await cTab.evaluate(getData,'#stats>.ytd-playlist-sidebar-primary-info-renderer');
        console.log(allDataObj.noOfVideos,allDataObj.noOfViews);
        let totalVideos = parseInt(allDataObj.noOfVideos.split(" ")[0]);
        console.log(totalVideos);
        let currentVideos = await totalCurrentVideos();
        console.log(currentVideos);
        console.log("hi", totalVideos - currentVideos);
        
        while(totalVideos - currentVideos > 0){
            
            scrollToBottom();
            currentVideos = await totalCurrentVideos();
        }
        let finalList = await cTab.evaluate(getVideoDetails,'#content #video-title' ,'#thumbnail span#text');
        const doc = new pdfkit();
        doc.pipe(fs.createWriteStream('output.pdf'));
        doc.text(JSON.stringify(finalList));
        doc.save();
        doc.end();
    }catch (err){
        console.log(err);
    }
})()

function getData(selector){
    let allDataArr = document.querySelectorAll(selector);
    let noOfVideos = allDataArr[0].innerText;
    let noOfViews = allDataArr[1].innerText;

    return {
        noOfVideos,
        noOfViews
    }
}
function totalCurrentVideos(){
    let length = cTab.evaluate(function(select){return document.querySelectorAll(select).length},'#container>#thumbnail.ytd-playlist-video-renderer');
    return length;
}

function scrollToBottom(){
     cTab.evaluate(function(){
        window.scrollBy(0,window.innerHeight);
    });
}

function getVideoDetails(videoSelector,durationSelector){
                        // #content #video-title // #thumbnail span#text
        let videoTitlesArr = document.querySelectorAll(videoSelector);
        let durationArr = document.querySelectorAll(durationSelector);
        console.log(videoTitlesArr.length,durationArr.length);
        let completeList = [];
        for(let i = 0; i < durationArr.length; i++){
            completeList.push({
                videoTitle: videoTitlesArr[i].innerText,
                duration: durationArr[i].innerText,
            })
        }
        return completeList;
        

}