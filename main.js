const fs = require("fs");

function toSeconds12h(timeStr) {
    timeStr = timeStr.trim().toLowerCase();
    const period = timeStr.slice(-2); // "am" or "pm"
    const timePart = timeStr.slice(0, -2).trim();
    let [h, m, s] = timePart.split(":").map(Number);
    if (period === "pm" && h !== 12) h += 12;
    if (period === "am" && h === 12) h = 0;
    return h * 3600 + m * 60 + s;
}

function hmsToSeconds(hmsStr) {
    const [h, m, s] = hmsStr.trim().split(":").map(Number);
    return h * 3600 + m * 60 + s;
}

function secondsToHMS(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    // TODO: Implement this function
    return secondsToHMS(toSeconds12h(endTime) - toSeconds12h(startTime));
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    // TODO: Implement this function
        const DELIVERY_START = 8  * 3600; 
    const DELIVERY_END   = 22 * 3600; 

    const startSec = toSeconds12h(startTime);
    const endSec   = toSeconds12h(endTime);

    let idle = 0;

    if (startSec < DELIVERY_START) {
        idle += Math.min(DELIVERY_START, endSec) - startSec;
    }

    if (endSec > DELIVERY_END) {
        idle += endSec - Math.max(DELIVERY_END, startSec);
    }

    return secondsToHMS(idle);
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    // TODO: Implement this function
     return secondsToHMS(hmsToSeconds(shiftDuration) - hmsToSeconds(idleTime));

}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    // TODO: Implement this function
    const [year, month, day] = date.split("-").map(Number);
    const isEid = (year === 2025 && month === 4 && day >= 10 && day <= 30);
    const quota = isEid ? 6 * 3600 : 8 * 3600 + 24 * 60;
    return hmsToSeconds(activeTime) >= quota;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    // TODO: Implement this function
        const { driverID, driverName, date, startTime, endTime } = shiftObj;

    const content = fs.readFileSync(textFile, "utf-8");
    const lines = content.split("\n").filter(line => line.trim() !== "");

    for (const line of lines) {
        const cols = line.split(",");
        if (cols[0].trim() === driverID && cols[2].trim() === date) {
            return {};
        }
    }

    const shiftDuration = getShiftDuration(startTime, endTime);
    const idleTime      = getIdleTime(startTime, endTime);
    const activeTime    = getActiveTime(shiftDuration, idleTime);
    const quota         = metQuota(date, activeTime);
    const hasBonus      = false;

    const newEntry = `${driverID},${driverName},${date},${startTime},${endTime},${shiftDuration},${idleTime},${activeTime},${quota},${hasBonus}`;

    let lastIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].split(",")[0].trim() === driverID) {
            lastIndex = i;
        }
    }

    if (lastIndex === -1) {
        lines.push(newEntry);
    } else {
        lines.splice(lastIndex + 1, 0, newEntry);
    }

    fs.writeFileSync(textFile, lines.join("\n") + "\n", "utf-8");

    return {
        driverID,
        driverName,
        date,
        startTime,
        endTime,
        shiftDuration,
        idleTime,
        activeTime,
        metQuota: quota,
        hasBonus
    };
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function
    const content = fs.readFileSync(textFile, "utf-8");
    const lines = content.split("\n").filter(line => line.trim() !== "");

    for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(",");
        if (cols[0].trim() === driverID && cols[2].trim() === date) {
            cols[9] = newValue.toString();
            lines[i] = cols.join(",");
            break;
        }
    }

    fs.writeFileSync(textFile, lines.join("\n") + "\n", "utf-8");
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
    const content = fs.readFileSync(textFile, "utf-8");
    const lines = content.split("\n").filter(line => line.trim() !== "");

    let driverExists = false;
    let count = 0;

    for (const line of lines) {
        const cols = line.split(",");
        if (cols[0].trim() === driverID) {
            driverExists = true;
            const recordMonth = parseInt(cols[2].trim().split("-")[1]);
            const inputMonth  = parseInt(month);
            if (recordMonth === inputMonth && cols[9].trim() === "true") {
                count++;
            }
        }
    }

    return driverExists ? count : -1;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
        const content = fs.readFileSync(textFile, "utf-8");
    const lines = content.split("\n").filter(line => line.trim() !== "");

    let totalSeconds = 0;

    for (const line of lines) {
        const cols = line.split(",");
        if (cols[0].trim() === driverID) {
            const recordMonth = parseInt(cols[2].trim().split("-")[1]);
            if (recordMonth === month) {
                totalSeconds += hmsToSeconds(cols[7].trim());
            }
        }
    }

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {

    const fs = require("fs");
    const targetMonth = Number(month);

    const shiftContent = fs.readFileSync(textFile, "utf-8");
    const shiftLines = shiftContent.split("\n").filter(line => line.trim() !== "");

    const rateContent = fs.readFileSync(rateFile, "utf-8");
    const rateLines = rateContent.split("\n").filter(line => line.trim() !== "");

    let dayOff = null;

    for (const line of rateLines) {
        const cols = line.split(",");
        if (cols[0].trim() === driverID) {
            dayOff = cols[1].trim().toLowerCase();
            break;
        }
    }

    if (dayOff === null) {
        return "000:00:00";
    }

    const dayNames = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

    let totalSeconds = 0;

    for (const line of shiftLines) {

        const cols = line.split(",");

        if (cols[0].trim() !== driverID) continue;

        const dateStr = cols[2].trim();
        const parts = dateStr.split("-");
        const recordMonth = Number(parts[1]);

        if (recordMonth !== targetMonth) continue;

        const year = Number(parts[0]);
        const mon = Number(parts[1]);
        const day = Number(parts[2]);

        const dateObj = new Date(year, mon - 1, day);
        const dayName = dayNames[dateObj.getDay()];

        if (dayName === dayOff) continue;

        const isEid = (year === 2025 && mon === 4 && day >= 10 && day <= 30);

        if (isEid) {
            totalSeconds += 6 * 3600;
        } else {
            totalSeconds += (8 * 3600) + (24 * 60);
        }
    }

    totalSeconds -= bonusCount * 2 * 3600;

    if (totalSeconds < 0) totalSeconds = 0;

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function
    const content = fs.readFileSync(rateFile, "utf-8");
    const lines   = content.split("\n").filter(line => line.trim() !== "");

    let basePay = 0;
    let tier    = 0;

    for (const line of lines) {
        const cols = line.split(",");
        if (cols[0].trim() === driverID) {
            basePay = parseInt(cols[2].trim());
            tier    = parseInt(cols[3].trim());
            break;
        }
    }

    const allowedMissingHours = { 1: 50, 2: 20, 3: 10, 4: 3 };
    const allowed = allowedMissingHours[tier];

    const actualSec   = hmsToSeconds(actualHours);
    const requiredSec = hmsToSeconds(requiredHours);

    if (actualSec >= requiredSec) return basePay;

    const missingSec      = requiredSec - actualSec;
    const missingHours    = missingSec / 3600;

    const billableHours   = missingHours - allowed;

    if (billableHours <= 0) return basePay;

    const fullBillableHours     = Math.floor(billableHours);
    const deductionRatePerHour  = Math.floor(basePay / 185);
    const salaryDeduction       = fullBillableHours * deductionRatePerHour;

    return basePay - salaryDeduction;
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
