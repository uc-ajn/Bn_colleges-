//bookrow_id  bookstoreid	storeid	storenumber	storedisplayname	termid	termname	termnumber	programid	programname	campusid
//campusname	department	departmentname	division	divisionname	courseid	coursename	section	sectionname	instructor	schoolname	cmid	mtcid	bookimage
//title	edition	author	isbn	materialtype	requirementtype	publisher	publishercode	productcatentryid	copyrightyear	pricerangedisplay	booklink
//store_url	user_guid	course_codes	created_on	last_updated_on

import fetch from 'node-fetch';
import * as fs from 'fs';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import csvwriter from 'csv-writer';
const cheerio = require('cheerio');

let fullData = []
let csvData = 0;
let csvDataNotFound = 0;
let countfullData = [];
let countNotFoundData = [];

const storeNames = ["enmu"]; //Enter Store name Here in between these two brakes and inverted comma's.

const store_id = 35551 // Enter the store store Id here 

const fetchBooksData = async () => {
    try {
        let campusesCode = await getStore(storeNames)
        console.log('Total Compus:', campusesCode.length)
        for (let c = 0; c < campusesCode.length; c++) { //campusesCode.length
            let campusCode = campusesCode[c].code;
            let campusName = campusesCode[c].name;
            console.log("Line No:31 Campus Name: ", campusesCode[c].name);
            if (!campusCode) {
                console.log("Blocked Campus Name API")
            } else {
                let terms = await getTerm(storeNames, campusCode);
                if (!terms) {
                    console.log("Blocked terms Name API");
                } else {
                    let counter = 0;
                    for (let t = 0; t < terms.length; t++) {  //terms.length,4
                        let termsCode = terms[t].code;
                        let termsName = terms[t].name;
                        let departments = await getDepartment(storeNames, campusCode, termsCode);
                        counter += departments.length;
                        if (!departments) {
                            console.log("Blocked departments API");
                        } else {
                            var depFile = JSON.stringify(departments);
                            if (!fs.existsSync(`bn_deps/${storeNames[0]}_deps`)) {
                                fs.mkdirSync(`bn_deps/${storeNames[0]}_deps`)
                            }
                            fs.writeFile('./bn_deps/' + storeNames[0] + '_deps/bn_' + campusCode.split(" ").join("") + '_' + termsCode.split(" ").join("") + '_department.json', depFile, function (err) {
                                if (err) throw err;
                                console.log("line No:57" + 'Department Saved');
                            });
                            for (let d = 0; d < departments.length; d++) {
                                let departmentCode = departments[d].code;
                                let departmentName = departments[d].name
                                let courses = await getCourses(storeNames, termsCode, departmentCode) || '';
                                if (!courses) {
                                    console.log("Blocked courses API");
                                } else {
                                    for (let cs = 0; cs < courses.length; cs++) {
                                        let courseCode = courses[cs].code;
                                        let courseName = courses[cs].name;
                                        let sections = await getSections(storeNames, termsCode, departmentCode, courseCode)
                                        if (!sections) {
                                            console.log("line No:86 Blocked sections API");
                                        } else {
                                            for (let s = 0; s < sections.length; s++) {
                                                let sectionCode = sections[s].code;
                                                let sectionName = sections[s].name;
                                                console.log('Department Code:', departmentName)
                                                let codes;
                                                let schoolName = await getSchoolName(storeNames);
                                                let url = "https://" + storeNames[0] + ".bncollege.com/"
                                                let booksLength;
                                                let $;
                                                let code;
                                                for (let index = 1; index < 100; index++) {
                                                    let codes = termsCode + departmentCode.substr(departmentCode.lastIndexOf("_"), departmentCode.length) + "_" + courseCode + "_" + index;
                                                    let data = await getFinaldata(storeNames, termsCode, codes, sectionCode);
                                                    $ = cheerio.load(data);
                                                    booksLength = $(".bned-collapsible-container").eq(0).find('.bned-cm-item-main-container').length;
                                                    if (booksLength > 0) {
                                                        code = codes
                                                        break;
                                                    } else {
                                                        let tdcs_code = $(".bned-collapsible-head > h2 > a").text();
                                                        if (termsName.replace(/\s/g, '') + departmentName + courseName + sectionName == tdcs_code.replace(/\s/g, '')) {
                                                            let notfoundcode = $(".bned-collapsible-head > h2 > a").attr('href');
                                                            console.log("href", notfoundcode)
                                                            code = notfoundcode.substring(notfoundcode.split('_', 2).join('_').length + 1);
                                                            console.log("Books not Found", tdcs_code.replace(/\s/g, ''), '==', termsName.replace(/\s/g, '') + departmentName + courseName + sectionName, code);
                                                            break;
                                                        }
                                                    }
                                                }
                                                if (booksLength > 0) {
                                                    console.log("Line No:89 Total Found Books", booksLength)
                                                    console.log("Found Books course_code", code)
                                                    for (let i = 0; i < booksLength; i++) {
                                                        let data = {};
                                                        data["Course_code"] = code;
                                                        data["bookrow_id"] = ' ';
                                                        data["bookstoreid"] = $("[name=displayStoreId]").attr("value") || '';
                                                        data["storeid"] = store_id;
                                                        data["storenumber"] = ' ';
                                                        data["storedisplayname"] = schoolName;
                                                        data["termid"] = termsCode;
                                                        data["termname"] = termsName;
                                                        data["termnumber"] = ' ';
                                                        data["programid"] = ' ';
                                                        data["programname"] = ' ';
                                                        data["campusid"] = campusCode;
                                                        data["campusname"] = campusName;
                                                        data["department"] = departmentCode;
                                                        data["departmentname"] = departmentName;
                                                        data["division"] = ' ';
                                                        data["divisionname"] = ' ';
                                                        data["courseid"] = courseCode;
                                                        data["coursename"] = courseName;
                                                        data["section"] = sectionCode;
                                                        data["sectionname"] = sectionName;
                                                        data["instructor"] = ' ';
                                                        data["schoolname"] = schoolName;
                                                        data["cmid"] = ' ';
                                                        data["mtcid"] = ' ';
                                                        let bookimage;
                                                        let productsDetail
                                                        try {
                                                            productsDetail = await JSON.parse($(".js-bned-cm-cached-product-analytics-data").eq(i).text());
                                                        } catch (error) {
                                                            console.log('productsDetail', error);
                                                            continue;
                                                        }
                                                        let mbs = productsDetail[0].productInfo.baseProductID;
                                                        bookimage = await getImage(storeNames, mbs);

                                                        data["bookimage"] = bookimage;
                                                        data["title"] = $('.bned-cm-item-main-container').eq(i).find('span.js-bned-item-name-text').eq(0).text(); //book
                                                        let length = $('.bned-cm-item-main-container').eq(i).find('.bned-item-attributes-wp').find('.bned-item-attribute').length
                                                        if (length / 2 == 2) {
                                                            data["edition"] = 'Not Found';
                                                            data["author"] = $('.bned-cm-item-main-container').eq(i).find('.bned-item-attributes-wp').find('.author').eq(0).text().replace(/\s/g, '');
                                                            data["isbn"] = $('.bned-cm-item-main-container').eq(i).find('.bned-item-attributes-wp').find('.bned-item-attribute').eq(1).find("span").eq(1).text()
                                                            data["materialtype"] = ' ';
                                                            data["requirementtype"] = $('.bned-cm-item-main-container').eq(i).find('.badge').text().replace(/\s/g, '');
                                                            data["publisher"] = $('.bned-cm-item-main-container').eq(i).find('.bned-item-attributes-wp').find('.bned-item-attribute').eq(0).find("span").eq(1).text();
                                                        } else if (length / 2 == 3) {
                                                            data["edition"] = $('.bned-cm-item-main-container').eq(i).find('.bned-item-attributes-wp').find('.bned-item-attribute').eq(0).find("span").eq(1).text();
                                                            data["author"] = $('.bned-cm-item-main-container').eq(i).find('.bned-item-attributes-wp').find('.author').eq(0).text().replace(/\s/g, '');
                                                            data["isbn"] = $('.bned-cm-item-main-container').eq(i).find('.bned-item-attributes-wp').find('.bned-item-attribute').eq(2).find("span").eq(1).text()
                                                            data["materialtype"] = ' ';
                                                            data["requirementtype"] = $('.bned-cm-item-main-container').eq(i).find('.badge').text().replace(/\s/g, '');
                                                            data["publisher"] = $('.bned-cm-item-main-container').eq(i).find('.bned-item-attributes-wp').find('.bned-item-attribute').eq(1).find("span").eq(1).text();
                                                        }

                                                        data["publishercode"] = ' ';
                                                        data["productcatentryid"] = ' ';
                                                        data["copyrightyear"] = ' ';
                                                        let mbsId = productsDetail[0].productInfo.productID;
                                                        let price = await getPrice(storeNames, mbsId, termsCode, codes);
                                                        data["pricerangedisplay"] = price;
                                                        data["booklink"] = ' ';
                                                        data["store_url"] = url;
                                                        data["user_guid"] = ' ';
                                                        data["course_codes"] = ' ';
                                                        let today = new Date();
                                                        let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
                                                        let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                                                        let dateTime = date + ' ' + time;
                                                        data["created_on"] = dateTime;
                                                        data["last_updated_on"] = dateTime;
                                                        fullData.push(data);
                                                        countfullData.push(data);
                                                        csvData += countfullData.length;
                                                        countfullData = [];
                                                        console.log('"Found"', storeNames[0], store_id, campusName, c, termsName, t, "Depart " + departmentName, d, "Course " + courseName, cs, "section " + sectionName, s, i)
                                                    }
                                                } else {
                                                    let data = {};
                                                    data["bookrow_id"] = ' ';
                                                    data["bookstoreid"] = ' ';
                                                    data["storeid"] = store_id;
                                                    data["storenumber"] = ' ';
                                                    data["storedisplayname"] = schoolName;
                                                    data["termid"] = termsCode;
                                                    data["termname"] = termsName;
                                                    data["termnumber"] = ' ';
                                                    data["programid"] = ' ';
                                                    data["programname"] = ' ';
                                                    data["campusid"] = campusCode;
                                                    data["campusname"] = campusName;
                                                    data["department"] = departmentCode;
                                                    data["departmentname"] = departmentName;
                                                    data["division"] = ' ';
                                                    data["divisionname"] = ' ';
                                                    data["courseid"] = courseCode;
                                                    data["coursename"] = courseName;
                                                    data["section"] = sectionCode;
                                                    data["sectionname"] = sectionName;
                                                    data["instructor"] = ' ';
                                                    data["schoolname"] = schoolName;
                                                    data["cmid"] = ' ';
                                                    data["mtcid"] = ' ';
                                                    data["materialtype"] = ' ';
                                                    data["requirementtype"] = ' ';
                                                    data["publishercode"] = ' ';
                                                    data["productcatentryid"] = ' ';
                                                    data["copyrightyear"] = ' ';
                                                    data["booklink"] = ' ';
                                                    data["store_url"] = url;
                                                    data["user_guid"] = ' ';
                                                    data["course_codes"] = ' ';
                                                    let today = new Date();
                                                    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
                                                    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                                                    let dateTime = date + ' ' + time;
                                                    data["created_on"] = dateTime;
                                                    data["last_updated_on"] = dateTime;
                                                    data["Course_code"] = code;
                                                    fullData.push(data);
                                                    countNotFoundData.push(data);
                                                    csvDataNotFound += countNotFoundData.length;
                                                    countNotFoundData = [];
                                                    console.log('"Not Found"', storeNames[0], store_id, campusName, c, termsName, t, "Depart " + departmentName, d, "Course " + courseName, cs, "section " + sectionName)
                                                }
                                            }
                                        }
                                        createCsv(fullData)
                                        fullData = [];
                                    }
                                }
                            }
                        }
                    }
                    console.log('Departments counter', counter);
                }
            }

        }
    } catch (error) {
        console.log("line No 224 ", error)
    }
}

fetchBooksData();

function createCsv(fullData) {
    console.log('CSV Creating...')
    const createCsvWriter = csvwriter.createObjectCsvWriter;
    let csvWriter = createCsvWriter({
        path: `./data_csv/bnCollegesAayush_31Aug.csv`,
        header: [
            //bookrow_id,bookstoreid,storeid,storenumber,storedisplayname,termid,termname,termnumber,programid,programname,campusid,campusname,department,departmentname,division,divisionname,courseid,coursename,section,sectionname,instructor,schoolname,cmid,mtcid,bookimage,title,edition,author,isbn,materialtype,requirementtype,publisher,publishercode,productcatentryid,copyrightyear,pricerangedisplay,booklink,store_url,user_guid,course_codes,created_on,last_updated_on,code
            { id: 'bookrow_id', title: 'bookrow_id' },
            { id: 'bookstoreid', title: 'bookstoreid' },
            { id: 'storeid', title: 'storeid' },
            { id: 'storenumber', title: 'storenumber' },
            { id: 'storedisplayname', title: 'storedisplayname' },
            { id: 'termid', title: 'termid' },
            { id: 'termname', title: 'termname' },
            { id: 'termnumber', title: 'termnumber' },
            { id: 'programid', title: 'programid' },
            { id: 'programname', title: 'programname' },
            { id: 'campusid', title: 'campusid' },
            { id: 'campusname', title: 'campusname' },
            { id: 'department', title: 'department' },
            { id: 'departmentname', title: 'departmentname' },
            { id: 'division', title: 'division' },
            { id: 'divisionname', title: 'divisionname' },
            { id: 'courseid', title: 'courseid' },
            { id: 'coursename', title: 'coursename' },
            { id: 'section', title: 'section' },
            { id: 'sectionname', title: 'sectionname' },
            { id: 'instructor', title: 'instructor' },
            { id: 'schoolname', title: 'schoolname' },
            { id: 'cmid', title: 'cmid' },
            { id: 'mtcid', title: 'mtcid' },
            { id: 'bookimage', title: 'bookimage' },
            { id: 'title', title: 'title' },
            { id: 'edition', title: 'edition' },
            { id: 'author', title: 'author' },
            { id: 'isbn', title: 'isbn' },
            { id: 'materialtype', title: 'materialtype' },
            { id: 'requirementtype', title: 'requirementtype' },
            { id: 'publisher', title: 'publisher' },
            { id: 'publishercode', title: 'publishercode' },
            { id: 'productcatentryid', title: 'productcatentryid' },
            { id: 'copyrightyear', title: 'copyrightyear' },
            { id: 'pricerangedisplay', title: 'pricerangedisplay' },
            { id: 'booklink', title: 'booklink' },
            { id: 'store_url', title: 'store_url' },
            { id: 'user_guid', title: 'user_guid' },
            { id: 'course_codes', title: 'course_codes' },
            { id: 'created_on', title: 'created_on' },
            { id: 'last_updated_on', title: 'last_updated_on' },
            { id: 'Course_code', title: 'Course_code' },
        ], append: true
    });
    console.log(`Data uploaded into csv successfully Found Data length "${csvData}" not found data length "${csvDataNotFound}" = ${csvData + csvDataNotFound}`);
    csvWriter
        .writeRecords(fullData)
        .then(() => console.log(`Total length = ${csvData + csvDataNotFound}`));
}

async function getFinaldata(storeName, termCode, code, section) {
    var campuseCode = termCode.substr(0, termCode.indexOf("_"));
    let res = '';
    section = await section.slice(-1) == "+" ? section.replace("+", "%2B") : section
    try {
        const str = await fetch(`https://${storeName}.bncollege.com/course-material-caching/course?campus=${campuseCode}&term=${termCode}&course=${code}&section=${section}&oer=false`, {
            method: 'GET',
            mode: 'cors',
            headers: getHeaderString1(),
        })
        res = await str.text();
    } catch (error) {
        console.log("Line No:89,getFinaldata ", error);
    }
    return res;
}


async function getStore(storeName) {
    let res = '';
    try {
        for (let i = 0; i < storeNames.length; i++) {
            const str = await fetch(`https://${storeName}.bncollege.com/course-material/findCourse?courseFinderSuggestion=SCHOOL_CAMPUS&oer=false`, {
                method: 'GET',
                mode: 'cors',
                headers: getHeaderString(),
            })
            res = await str.json();
        }
    } catch (error) {
        console.log("store name API", error)
    }

    return res;
}


async function getTerm(storeName, campusId) {
    let res = '';
    try {
        const str = await fetch(`https://${storeName}.bncollege.com/course-material/findCourse?courseFinderSuggestion=SCHOOL_TERM&campus=${campusId}&oer=false`, {
            method: 'GET',
            mode: 'cors',
            headers: getHeaderString2(),
        })
        res = await str.json();
    } catch (error) {
        console.log("line No.43 Api error", error)
    }
    return res;
}

async function getDepartment(storeName, campusId, termId) {
    let res = '';
    try {
        const str = await fetch(`https://${storeName}.bncollege.com/course-material/findCourse?courseFinderSuggestion=SCHOOL_DEPARTMENT&campus=${campusId}&term=${termId}&oer=false`, {
            method: 'GET',
            mode: 'cors',
            headers: getHeaderString2(),
        })
        res = await str.json();
    } catch (error) {
        console.log("line No:52 error", error);
    }
    return res;
}

async function getCourses(storeName, termId, depId) {
    let res = '';
    try {
        const str = await fetch(`https://${storeName}.bncollege.com/course-material/findCourse?courseFinderSuggestion=SCHOOL_COURSE&campus=&term=${termId}&department=${depId}&oer=false`, {
            method: 'GET',
            mode: 'cors',
            headers: getHeaderString2(),
        })
        res = await str.json();
    } catch (err) {
        console.log('err', err);
    }
    return res;
}

async function getSections(storeName, termId, depId, courseId) {
    let res = '';
    try {
        const str = await fetch(`https://${storeName}.bncollege.com/course-material/findCourse?courseFinderSuggestion=SCHOOL_COURSE_SECTION&campus=&term=${termId}&department=${depId}&course=${courseId}&oer=false`, {
            method: 'GET',
            mode: 'cors',
            headers: getHeaderString2(),
        })
        res = await str.json();
    } catch (error) {
        console.log("line No:72 Section Api error: ", error);
    }
    return res;
}

async function getSchoolName(storeName) {
    let res = '';
    try {
        const str = await fetch(`https://${storeName}.bncollege.com/`, {
            method: 'GET',
            mode: 'cors',
            headers: getHeaderString2(),
        })
        const ret = await str.text();
        const $ = cheerio.load(ret);
        res = $(".banner__component").find("a").find("img").attr("alt");
    } catch (error) {
        console.error("Line No:108", error);
    }
    return res;
}

async function getPrice(storeName, mbsId, termId, codes) {
    let res = '';
    try {
        const str = await fetch(`https://${storeName}.bncollege.com/product-price/${mbsId}?campusCode=&termCode=${termId}&courseCode=${codes}`, {
            method: 'GET',
            mode: 'cors',
            headers: getHeaderString2(),
        })
        const ret = await str.text();
        res = JSON.parse(ret).plpPrice.html;
    } catch (error) {
        console.log("Price API error", error)
    }
    return res;
}

async function getImage(storeName, mbsId) {
    let res = '';
    try {
        const str = await fetch(`https://${storeName}.bncollege.com/product-image/${mbsId}?format=product`, {
            method: 'GET',
            mode: 'cors',
            headers: getHeaderString2(),
        })
        const ret = await str.text();
        const $ = cheerio.load(ret);
        res = $("img").attr("src");
    } catch (error) {
        console.log("Image API Error", error)
    }
    return res;
}

function getHeaderString() {
    return {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36'
    }
}

function getHeaderString1() {
    return {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'text/html;charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36',
        'gzip': true
    }
}

function getHeaderString2() {
    return {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36'
    }
}

// async function getBooks(storeName, campusId) {
//     var campusLen = campusId.length;
//     console.log(campusId);
//     // change the campus number
//     for (let t = 0; t < campusLen; t++) {
//         console.log("Campues" + t);
//         // campusId[i].code;
//         console.log(campusId[t].code);
//         let term = await getTerm(storeName, campusId[t].code);
//         console.log(term);
//         var termLen = term.length;
//         if (termLen > 0) {
//             for (let a = 0; a < termLen; a++) {
//                 let fullData = [];
//                 if (term[a].code) {
//                     let department = await getDepartment(storeName, term[a].code) || '';
//                     // console.log(department);
//                     let depLen = department.length;
//                     if (depLen > 0) {
//                         // department Name 
//                         for (let i = 0; i < depLen; i++) {
//                             var depId = department[i].code;
//                             var depName = department[i].name;
//                             let courses = await getCourses(storeName, term[a].code, depId) || '';
//                             // console.log(courses);
//                             let courseLen = courses.length;
//                             if (courseLen > 0) {
//                                 for (let j = 0; j < courseLen; j++) {
//                                     var courseId = courses[j].code;
//                                     var courseName = courses[j].name;
//                                     let sections = await getSections(storeName, term[a].code, depId, courseId);
//                                     console.log(courseName);
//                                     let sectionLen = sections.length;
//                                     if (sectionLen > 0) {
//                                         for (let k = 0; k < sectionLen; k++) {

//                                             var codes = term[a].code + depId.substr(depId.lastIndexOf("_"), depId.length) + "_" + courseId + "_1";
//                                             // console.log(codes);
//                                             var data = await getFinaldata(storeName, term[a].code, codes, sections[k].code);
//                                             const $ = cheerio.load(data);
//                                             var termName = term[a].name;
//                                             var departmentName = depName;
//                                             var courseName = courseName;
//                                             var sectionName = sections[k].name;
//                                             var url = "https://" + storeName + ".bncollege.com/";
//                                             var schoolName = await getSchoolName(storeName);
//                                             var booksLen = $(".bned-collapsible-container").eq(0).find('.bned-cm-item-main-container').length;
//                                             if (booksLen > 0) {
//                                                 for (let i = 0; i < booksLen; i++) {
//                                                     var data = {};
//                                                     data["term"] = termName;
//                                                     data["department"] = departmentName;
//                                                     data["course"] = courseName;
//                                                     data["section"] = sectionName;
//                                                     data["url"] = url;
//                                                     data["school"] = schoolName;
//                                                     data["book"] = $('.bned-cm-item-main-container').eq(i).find('span.js-bned-item-name-text').eq(0).text();
//                                                     data["required"] = $('.bned-cm-item-main-container').eq(i).find('.badge').text().replace(/\s/g, '');
//                                                     data["author"] = $('.bned-cm-item-main-container').eq(i).find('.bned-item-attributes-wp').find('.author').eq(0).text().replace(/\s/g, '');
//                                                     data["isbn"] = $('.bned-cm-item-main-container').eq(i).find('.bned-item-attributes-wp').find('.bned-item-attribute').eq(2).find("span").eq(1).text()
//                                                     data["publisher"] = $('.bned-cm-item-main-container').eq(i).find('.bned-item-attributes-wp').find('.bned-item-attribute').eq(1).find("span").eq(1).text();
//                                                     data["edition"] = $('.bned-cm-item-main-container').eq(i).find('.bned-item-attributes-wp').find('.bned-item-attribute').eq(0).find("span").eq(1).text();

//                                                     var productsDetail = JSON.parse($(".js-bned-cm-cached-product-analytics-data").eq(i).text());
//                                                     var mbsId = productsDetail[0].productInfo.productID;
//                                                     var price = await getPrice(storeName, mbsId, term[a].code, codes);
//                                                     data["price"] = price;

//                                                     var mbs = productsDetail[0].productInfo.baseProductID;
//                                                     var image = await getImage(storeName, mbs);
//                                                     data["image_url"] = image;
//                                                     fullData.push(data);
//                                                     console.log(data);
//                                                 }
//                                             } else {
//                                                 var data = {};
//                                                 data["term"] = termName;
//                                                 data["department"] = departmentName;
//                                                 data["course"] = courseName;
//                                                 data["section"] = sectionName;
//                                                 data["url"] = url;
//                                                 data["school"] = schoolName;
//                                                 fullData.push(data);
//                                                 console.log(data);
//                                             }

//                                             // data.push(sData);
//                                         }
//                                     } else {
//                                         //             let sData = {storeId,storeName,school,campusName,campusId,termName,termId,depName,depId,courseName,courseId,sectionName,sectionId,bookName,bookLink,newBookId,bookImg,author,edition,publisher,isbn}
//                                         //             data.push(sData);
//                                     }
//                                     console.log(depName);
//                                 }
//                             } else {
//                                 //     let sData = {storeId,storeName,school,campusName,campusId,termName,termId,depName,depId,courseName,courseId,sectionName,sectionId,bookName,bookLink,newBookId,bookImg,author,edition,publisher,isbn}
//                                 //     data.push(sData);
//                             }

//                             var depFile = JSON.stringify(fullData);
//                             fs.writeFile('./depjson/bncollege_' + storeName.split(" ").join("") + '_' + campusId[t].name.split(" ").join("") + '_' + term[a].name.split(" ").join("") + '_' + depName.split(" ").join("") + '_department_' + i + '.json', depFile, function (err) {
//                                 if (err) throw err;
//                                 console.log('Department Saved');
//                             });

//                             //create csv for get books
//                             let source = await csvToJsonData().fromFile("./bncollege.csv");
//                             for (let d = 0; d < fullData.length; d++) {
//                                 source.push(fullData[d]);
//                             }
//                             const csv = jsonToCsvData(source, { fields: ["url", "school", "term", "department", "course", "section", "book", "author", "edition", "publisher", "isbn", "image_url", "required", "price"] });
//                             fs.writeFileSync("./bncollege.csv", csv);
//                             console.log("saved json data in csv");

//                         }
//                     } else {
//                         // let sData = {storeId,storeName,school,campusName,campusId,termName,termId,depName,depId,courseName,courseId,sectionName,sectionId,bookName,bookLink,newBookId,bookImg,author,edition,publisher,isbn}
//                         // data.push(sData);
//                     }
//                 }
//             }
//         } else {
//             let sData = { storeId, storeName, school, campusName, campusId, termName, termId, depName, depId, courseName, courseId, sectionName, sectionId, bookName, bookLink, newBookId, bookImg, author, edition, publisher, isbn }
//             data.push(sData);
//         }
//         // console.log(data);
//         return data;
//     }//department breaket

// }





// function wait(ms){
//     return;
//     ms = ms || false;
//     if (!ms) {
//         // ms = generateTimeStamp(20000, 30000);

//         ms = generateTimeStamp(2000, 4000);
//     }
//     var start = new Date().getTime();
//     var end = start;
//     while(end < start + ms) {
//         end = new Date().getTime();
//     }
// }

// function generateTimeStamp(min, max) {
//     return Math.floor(Math.random() * (max - min + 1) + min);
// }



