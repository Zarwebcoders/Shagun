# Income Calculation Breakdown

Aapke sawaal bahut genuine hain. Main ek-ek karke teeno data points clear karta hu, kyunki system ka logic thoda unique tarike se kaam kar raha hai:

### 1. Level Income (Main Box vs. Modal Box)
- **Main Box (SGN 5,377.83)**: Ye aapki aaj tak ki **Total Earned Level Income** hai.
- **Modal Box (SGN 2,688.92)**: Ye aapka **Available Withdrawal Balance** hai jo aap abhi nikal sakte hain.
- **Dono alag kyu hain?** Kyunki system ne ek rule banaya hai: aap ek baar me sirf utna hi nikal sakte hain jitna aapka "Bi-monthly" (15 days ka) limit allow karta hai. Is case me, aapka bi-monthly withdrawal exactly aapki total level income ka aadha ban raha hai isliye aisi value aa rahi hai.

### 2. "6 Months" ki Income ka Confusion (15-day policy)
Aap bilkul sahi hain ki income har 15 din me aani chahiye, lekin yaha ek mathematical twist hai:
- System pehle sabhi network id's ki **Annual Level Income** nikalta hai.
- Phir us Annual Income ko **24 hisso me** divide karta hai (saal me 24 baar 15-din aate hain).
- Jo SGN 2,688.92 dikh raha hai, wo asal me 6 mahine ka ikattha amount nahi hai, balki aapki **Total Annual Income ka ek hissa (1/24th)** hai, jo har 15 din me nikalne ke liye available hota hai. Mathematical coincidence ki wajah se ye value 6 months ki monthly income jitni lag rahi hai.

### 3. Total Income (1,65,588.752) Kese Aayi?
Ye aapke account ki aaj tak ki saari kamayi ka jod (sum) hai. Isme shamil hain:
- Level Income
- Mining Bonus (Self ROI)
- Stake ROI (agar koi hai)
- Annual Bonus 
- *Note: Is total me se aapne already jo withdraw kar liya hai, wo minus nahi hota, ye hamesha gross (total) earning dikhata hai.*

**Kya aap chahte hain main is Dashboard ya Modal UI me koi change karu taaki ye samajhne me zyada aasaan ho jaye? Jaise Main Box aur Modal ko align karna?**
