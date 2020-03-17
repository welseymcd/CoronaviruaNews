const axios = require("axios");
const cheerio = require("cheerio");


//
// News API functions
//
async function contextualwebSearch(searchString, lastRun){
    const timestanp = Date.now();
    
    const options = {
        "method":"GET",
        "url":"https://contextualwebsearch-websearch-v1.p.rapidapi.com/api/Search/NewsSearchAPI",
        "headers":{
        "content-type":"application/octet-stream",
        "x-rapidapi-host":"contextualwebsearch-websearch-v1.p.rapidapi.com",
        "x-rapidapi-key":"y3jEq8irx4JhuCXWKdlUpSsG10Caampr"
        },"params":{
        "autoCorrect":"false",
        "pageNumber":"1",
        "pageSize":"50",
        "q":searchString,
        "safeSearch":"false"
        }
        }
    if(lastRun){
        console.log("Put timestamps in options")
    }
    
    const response = await axios(options);
    return response;
}

async function loadLancasterOnline() {
    return await axios({
        url: "https://lancasteronline.com/news"
    })
}

async function syncCoronaVirusStats() {
    var updateTime;
    var response;
    
    //
    // Load and parse most recent CDC state data
    //
    response = await axios({url: "https://www.cdc.gov/coronavirus/2019-ncov/map-data-cases.csv"});
    var lines = response.data.split("\r\n");
    var stateStats = lines.filter((line, index)=> (line!== "" && index > 0)).map((line)=>{
        return line.replace("'", "").split(",");
    })

    //
    // Load and parse case data
    // 
    response = await axios({url: "https://www.cdc.gov/coronavirus/2019-ncov/cases-updates/cases-in-us.html?CDC_AA_refVal=https%3A%2F%2Fwww.cdc.gov%2Fcoronavirus%2F2019-ncov%2Fcases-in-us.html"});
    $ = cheerio.load(response.data);
    totalsBreakdown = {}
    $('.2019coronavirus > div > div > table > tbody > tr > td').each((index, element)=>{
        if(index === 1){
            totalsBreakdown["travel"] = parseInt($(element).text().trim().replace(/\u200B/g,'').replace(",", ""));
        } else if(index === 3) {
            totalsBreakdown["closeContact"] = parseInt($(element).text().trim().replace(/\u200B/g,'').replace(",", ""));
        } else if(index == 5) {
            totalsBreakdown["underInvestigation"] = parseInt($(element).text().trim().replace(/\u200B/g,'').replace(",", ""));
        } else if(index === 7) {
            totalsBreakdown["total"] = parseInt($(element).text().trim().replace(/\u200B/g,'').replace(",", ""));
        }
    })
    totalsBreakdown["states"] = stateStats;

    //
    // Load and parse most recent PA data
    //
    response = await axios({url: "https://www.health.pa.gov/topics/disease/Pages/Coronavirus.aspx"});
    $ = cheerio.load(response.data);
    const countyStats = {};
    const totalCases = {
        negative: 0,
        positive: 0,
    }
    $(".ms-rteTable-default > tbody > tr").each((rowIndex, element)=>{
        let county;
        $(element).find("td").each((index, column)=>{
            if(rowIndex === 1){
                if(index === 0){
                    totalCases.negative = parseInt($(column).text().trim().replace(/\u200B/g,''));
                } else if (index === 1) {
                    totalCases.positive = parseInt($(column).text().trim().replace(/\u200B/g,''));
                }
            } else if(rowIndex > 1){
                if(index === 0){
                    county = $(column).text().trim();
                } else if(index=== 1){
                    countyStats[county] = parseInt($(column).text().trim());
                }
            }
        })
    })
    $('span.ms-rteStyle-Quote').each((index, element)=>{
        var updateText = $(element).text().trim().replace(/\u200B/g,'');
        updateTime = updateText.split(" at ")[1];
        updateTime = updateTime.split(" on ");
    })
    const paCases = {
        update: {
            date: updateTime[1],
            time: updateTime[0]
        },
        total: totalCases,
        counties: countyStats
    }
    console.log(paCases);
    console.log(totalsBreakdown)

    


}

async function main(){
    var response = await contextualwebSearch("us coronavirus");
    /*
    if(response.data.value.length > 0){
        for(const article of response.data.value){
            console.log(article.title);
        }
    } else {
        console.log("No new articles");
    }
    response = await loadLancasterOnline();
    var $ = cheerio.load(response.data);
    $('.card-headline').each((index, element)=>{
        if($(element).text() !== ""){
            console.log($(element).text().trim());
        }
        
    });
*/
    await syncCoronaVirusStats();

}

main();