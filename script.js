(function(){
    // --- KHỞI TẠO HỆ THỐNG BIẾN BẢO MẬT ---
    let cash=100000000, turn=1, selected='TECH', chart, labels=["P1"], inventory={}, itemMarkets={}, currentShopItems=[], timeLeft=120, shopOpenedInThisTurn=!1, preResults={};
    let hasVisitedShop = false; // Biến kiểm tra điều kiện vào chợ
    let investigatedPrices = [];
    

    const TOTAL_TIME=120;
    const market={
        'TECH':{p:100000,startP:100000,h:[100000],o:0,name:'Công nghệ AI'},
        'BANK':{p:50000,startP:50000,h:[50000],o:0,name:'Ngân hàng TMCP'},
        'GOLD':{p:80000,startP:80000,h:[80000],o:0,name:'Quỹ Vàng'},
        'FOOD':{p:30000,startP:30000,h:[30000],o:0,name:'Thực phẩm sạch'},
        'LAND':{p:60000,startP:60000,h:[60000],o:0,name:'Bất động sản'}
    };
    const shopData={
        "🔹 Nhóm giá rẻ":[{n:"Bánh màn thầu",p:5e3},{n:"Túi trà thảo mộc",p:8e3}],
        "🔸 Nhóm trung bình":[{n:"Bình rượu gạo",p:45e3},{n:"Hộp mực thư pháp",p:6e4}],
        "🔶 Nhóm giá cao":[{n:"Kiếm sắt rèn",p:35e4},{n:"Bộ trà gốm",p:5e5}],
        "🔱 Nhóm hàng hiếm":[{n:"Ngọc bội thượng phẩm",p:3e6},{n:"Linh dược quý hiếm",p:8e6}]
    };
    const events=[
        {n:"Chiến tranh chip",t:"TECH",m:0.6,d:"Giá công nghệ giảm sâu!"},
        {n:"Lạm phát thực phẩm",t:"FOOD",m:1.4,d:"Thực phẩm tăng giá!"}
    ];

    const notify=(m,t='info')=>{
        const c=document.getElementById('notify-box')||Object.assign(document.createElement('div'),{id:'notify-box',style:'position:fixed;top:20px;right:20px;z-index:10000'});
        document.body.appendChild(c);
        const s=document.createElement('div');
        s.style=`background:${t==='err'?'#ef4444':'#10b981'};color:#fff;padding:12px;margin-bottom:8px;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);font-weight:bold;`;
        s.innerText=m; c.appendChild(s);
        setTimeout(()=>{s.style.opacity='0';setTimeout(()=>s.remove(),500)},3000);
    };

    const getWinRate=s=>Math.max(0.1,Math.min(0.9,0.5-((s.p-s.startP)/s.startP)));
    
    const preCalc=()=>{
        const keys = Object.keys(market);
        // Xáo trộn danh sách các mã để chọn ngẫu nhiên vị trí đúng/sai
        const shuffledKeys = [...keys].sort(() => 0.5 - Math.random());
        
        // Quy ước: 3 mã đầu tiên trong danh sách xáo trộn sẽ dự đoán ĐÚNG, 2 mã còn lại SAI
        const correctPredictionKeys = shuffledKeys.slice(0, 3);

        keys.forEach(k => {
            let s = market[k];
            let isActualUp = Math.random() < getWinRate(s); // Biến động thực tế sẽ xảy ra
            let vol = Math.random() * 0.12 + 0.02;
            
            // Kiểm tra xem mã này thuộc nhóm dự đoán đúng hay sai
            let predictionWillBeTrue = correctPredictionKeys.includes(k);

            preResults[k] = {
                u: isActualUp,              // Chiều hướng thực tế
                c: isActualUp ? 1 + vol : 1 - vol, 
                isPredictionTrue: predictionWillBeTrue // Báo lá cải sẽ nói đúng hay nói điêu
            };
        });
    };

    const randomizeShop=()=>{
        currentShopItems=[]; 
        for(let c in shopData){
            let items=[...shopData[c]].sort(()=>0.5-Math.random()).slice(0,2);
            items.forEach(i=>{
                currentShopItems.push(i.n); 
                itemMarkets[i.n]=Math.round(i.p*(1+(Math.random()*0.24-0.12)));
            });
        }
    };

    const processMarket=(silent=!1)=>{
        for(let k in market){
            let s=market[k],res=preResults[k];
            s.p=Math.round(s.p*(res?res.c:(1+(Math.random()*0.2-0.1))));
            if(s.p<100)s.p=100; s.h.push(s.p); if(s.h.length>15)s.h.shift();
        }
        if(!silent&&Math.random()<0.04){
            let e=events[Math.floor(Math.random()*events.length)];
            market[e.t].p=Math.round(market[e.t].p*e.m); 
            notify(`⚠️ ${e.n}: ${e.d}`);
        }
        turn++;
        if (typeof SpecialEventSystem !== 'undefined') {
        SpecialEventSystem.checkTrigger(turn);
        if (SpecialEventSystem.getStatus().isEventActive) {
            SpecialEventSystem.randomizeRarePrices(); // Cập nhật giá đồ hiếm mỗi lượt
        }
    }
         labels.push("P"+turn); if(labels.length>15)labels.shift();
        preCalc(); 
        if(!silent){
            timeLeft=TOTAL_TIME; 
            shopOpenedInThisTurn=!1;
            investigatedPrices = [];
            hasVisitedShop = false; // Reset trạng thái khi sang lượt mới
            const b=document.getElementById('btn-open-shop'); 
            if(b){b.style.opacity="1"; b.innerText="🏪 Vào Khu Chợ (Mua)"}
            randomizeShop(); updateDisplay(); saveGame();
        }
    };
    // Tìm và thay thế hàm hireDetective của bạn bằng bản này:
window.hireDetective = () => {
    const investigatedNames = investigatedPrices.map(item => item.n);
    const hiddenItems = currentShopItems.filter(name => !investigatedNames.includes(name));

    if (hiddenItems.length === 0) return notify("Thám tử: Đã hết sạch món để điều tra!", "err");

    const cost = 5000000; 

    if (cash >= cost) {
        cash -= cost;
        const targetName = hiddenItems[Math.floor(Math.random() * hiddenItems.length)];
        const targetPrice = itemMarkets[targetName];

        let basePrice = 0;
        for (let cat in shopData) {
            let found = shopData[cat].find(i => i.n === targetName);
            if (found) { basePrice = found.p; break; }
        }

        // Tính toán và ép kiểu về String để hiển thị
        const diffPercent = basePrice > 0 ? ((targetPrice - basePrice) / basePrice * 100).toFixed(1) : "0.0";
        
        let comment = "";
        let pctNum = parseFloat(diffPercent);
        if (pctNum >= 8) comment = "Kèo thơm, gom hàng ngay!";
        else if (pctNum >= 3) comment = "Có lãi nhẹ, cân nhắc mua.";
        else if (pctNum >= -3) comment = "Giá dậm chân tại chỗ.";
        else if (pctNum >= -8) comment = "Thị trường ép giá, bán là lỗ.";
        else comment = "Thảm họa! Tuyệt đối đừng đụng vào.";

        // ĐẨY DỮ LIỆU VÀO MẢNG - Chú ý tên các key
        investigatedPrices.push({ 
            n: targetName, 
            p: targetPrice, 
            pct: diffPercent, // Đảm bảo key này tồn tại
            nx: comment      // Đảm bảo key này tồn tại
        });

        notify(`🕵️ Đã có tin về [${targetName}]: ${diffPercent}%`);
        renderNews(); 
        updateDisplay();
        saveGame();
    } else {
        notify("Không đủ tiền thuê thám tử!", "err");
    }
};

    const updateDisplay=()=>{
        let sv=Object.values(market).reduce((a,s)=>a+(s.p*(s.o||0)),0);
        document.getElementById('cash').innerText=Math.floor(cash).toLocaleString()+" đ";
        document.getElementById('stock-val').innerText=sv.toLocaleString()+" đ";
        document.getElementById('total').innerText=(Math.floor(cash)+sv).toLocaleString()+" đ";
        
        const tb=document.getElementById('market-table');
        if(!tb) return;
        tb.innerHTML='';
        for(let k in market){
            let s=market[k],old=s.h[s.h.length-2]||s.p,chg=((s.p-old)/old*100).toFixed(1);
            let tr=document.createElement('tr'); 
            if(k===selected) tr.className='active';
            tr.onclick=()=>{selected=k; updateDisplay()};
            tr.innerHTML=`<td><b>${k}</b></td><td>${s.p.toLocaleString()}</td><td style="color:${s.p>=old?'#10b981':'#ef4444'}">${s.p>=old?'▲':'▼'} ${Math.abs(chg)}%</td><td>${s.o||0}</td>`;
            tb.appendChild(tr);
        }
        document.getElementById('target-name').innerText=selected;
        if(chart){
            chart.data.labels=labels;
            chart.data.datasets[0].data=market[selected].h;
            chart.update('none');
        }
        const qtyInput = document.getElementById('trade-qty');
    if (qtyInput) {
        const s = market[selected];
        
        // Hàm tính toán nhanh
        const updateEstimate = () => {
            const q = Math.abs(parseInt(qtyInput.value)) || 0;
            const total = q * s.p;
            
            // Tìm hoặc tạo chỗ hiển thị tiền
            let estDiv = document.getElementById('trade-estimate');
            if (!estDiv) {
                estDiv = document.createElement('div');
                estDiv.id = 'trade-estimate';
                estDiv.style = 'font-size: 13px; margin-top: 8px; font-weight: bold; padding: 5px; background: #f3f4f6; border-radius: 4px; border-left: 4px solid #3b82f6;';
                qtyInput.parentNode.appendChild(estDiv);
            }
            
            // Hiển thị kết quả (Màu xanh nếu đủ tiền, màu đỏ nếu không đủ)
            const canAfford = total <= cash;
            estDiv.innerHTML = `Thành tiền: <span style="color:${canAfford ? '#10b981' : '#ef4444'}">${total.toLocaleString()} đ</span>`;
        };

        // Gán sự kiện lắng nghe khi người dùng gõ số
        qtyInput.oninput = updateEstimate;
        // Gọi luôn để cập nhật số tiền ngay khi đổi mã chứng khoán (selected)
        updateEstimate();
    }
        
    };

    window.handleTrade=(t)=>{
        let q=Math.abs(parseInt(document.getElementById('trade-qty').value))||0, s=market[selected];
        if(t==='BUY'&&s.p*q<=cash){
            cash-=s.p*q; s.o=(s.o||0)+q; 
            notify(`Đã mua ${q} ${selected}`);
        } else if(t==='SELL'&&(s.o||0)>=q){
            cash+=s.p*q; s.o-=q; 
            notify(`Đã bán ${q} ${selected}`);
        } else notify("Không đủ nguồn lực!","err");
        updateDisplay(); saveGame();
    };
    window.buyMax = (n, p) => {
    let maxQty = Math.floor(cash / p);
    if (maxQty > 0) {
        let totalCost = maxQty * p;
        cash -= totalCost;
        inventory[n] = (inventory[n] || 0) + maxQty;
        
        notify(`Đã dùng ${(totalCost).toLocaleString()}đ mua ${maxQty} ${n}`);
        
        // Sau khi mua xong, số dư tiền (cash) thay đổi nên phải vẽ lại Shop để cập nhật "Sức mua" mới
        updateInv();
        updateDisplay();
        renderShop(); 
        saveGame();
    } else {
        notify("Bạn không đủ tiền mua món này!", "err");
    }
};

    window.buyItem = (n, p, id) => {
    let q = Math.abs(parseInt(document.getElementById(id).value)) || 0;
    if (q > 0 && cash >= p * q) {
        cash -= p * q;
        inventory[n] = (inventory[n] || 0) + q;
        notify(`Đã mua ${q} ${n}`);
        
        updateInv();
        updateDisplay();
        renderShop(); // Cập nhật lại giao diện shop để tính lại số lượng tối đa
        saveGame();
    } else {
        notify("Thất bại! Tiền không đủ hoặc số lượng sai.", "err");
    }
};

    window.sellItem=(n,p)=>{
        let o=inventory[n]||0; 
        if(o>0){
            cash+=p*o; inventory[n]=0;
            updateInv(); renderSell(); updateDisplay(); saveGame();
            notify(`Đã thanh lý ${n}`);
        }
    };

    const updateInv=()=>{
        const i=Object.entries(inventory).filter(e=>e[1]>0);
        document.getElementById('inventory-list').innerHTML=i.length?i.map(e=>`<span class="inv-tag" style="background:#ddd;padding:2px 6px;margin:2px;border-radius:4px;display:inline-block">${e[0]} x${e[1]}</span>`).join(""): "Trống";
    };

    window.toggleNews=(s)=>{
        document.getElementById('news-modal').style.display=s?'flex':'none';
        if(s) renderNews();
    };

    const renderNews = () => {
    // --- Phần Tin Quy Hoạch (Stock) giữ nguyên ---
    let h = '<h4 style="color:#b45309; border-bottom:1px solid #fed7aa; padding-bottom:5px">📰 Tin Quy Hoạch</h4>';
    for(let k in market){
        if(!preResults[k]) continue;
        const res = preResults[k];
        const newsSayUp = res.isPredictionTrue ? res.u : !res.u;
        h += `<div style="margin:4px 0; font-size:13px">● Mã ${k}: Dự báo <b>${newsSayUp ? 'TĂNG' : 'GIẢM'}</b></div>`;
    }

    // --- Phần Thám Tử (Mới) ---
    h += '<h4 style="color:#1e40af; border-bottom:1px solid #bfdbfe; margin-top:15px; padding-bottom:5px">🕵️ Báo Cáo Thám Tử</h4>';
    h += `<button onclick="hireDetective()" style="width:100%; background:#3b82f6; color:white; border:none; padding:8px; border-radius:4px; cursor:pointer; font-weight:bold; margin-bottom:10px">
            Thuê điều tra (5.000.000đ)
          </button>`;
    
    h += '<div style="background:#f8fafc; padding:8px; border-radius:6px; max-height:180px; overflow-y:auto; border:1px solid #e2e8f0">';
    if(investigatedPrices.length === 0) {
        h += '<i style="color:#94a3b8; font-size:12px">Chưa có dữ liệu...</i>';
    } else {
        investigatedPrices.forEach(item => {
    // Ép kiểu pct về số để so sánh màu, nếu undefined thì coi như bằng 0
    const valPct = parseFloat(item.pct || 0); 
    const color = valPct >= 0 ? '#10b981' : '#ef4444';
    const sign = valPct >= 0 ? '+' : '';
    
    h += `
        <div style="font-size:12px; margin-bottom:8px; border-bottom:1px dashed #cbd5e1; padding-bottom:4px">
            <b style="color:#1e293b">${item.n}</b>: 
            <span style="color:${color}; font-weight:bold">${sign}${item.pct || '0.0'}%</span> 
            (${(item.p || 0).toLocaleString()}đ)<br>
            <i style="color:#64748b">💬 NX: ${item.nx || 'Chưa có nhận xét'}</i>
        </div>`;
});
    }
    h += '</div>';

    document.getElementById('news-list-container').innerHTML = h;
};

    window.toggleShop=(s)=>{
        if(s && shopOpenedInThisTurn) return notify("Phiên chợ đã kết thúc!","err");
        
        if(s) {
            hasVisitedShop = true; // Đánh dấu đã vào chợ
            renderShop();
            document.getElementById('shop-modal').style.display = 'flex';
        } else {
            document.getElementById('shop-modal').style.display = 'none';
            // Chỉ khi đóng chợ mới tính là kết thúc phiên để khóa nút
            shopOpenedInThisTurn = true; 
            const b = document.getElementById('btn-open-shop');
            if(b){b.style.opacity = "0.5"; b.innerText = "Chợ đã đóng cửa"}
        }
    };

    const renderShop = () => {
    let h = ''; 
    for (let c in shopData) {
        let items = shopData[c].filter(i => currentShopItems.includes(i.n));
        if (items.length > 0) h += `<h4 style="color:#3b82f6; border-bottom: 1px solid #eee; padding-bottom: 5px;">${c}</h4>`;
        
        items.forEach(i => {
            const id = `buy-qty-${i.n.replace(/\s+/g, '-')}`;
            // Tính số lượng tối đa có thể mua ngay tại thời điểm mở shop
            const maxAfford = Math.floor(cash / i.p);
            
            h += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding: 8px; background: #f9fafb; border-radius: 8px;">
                <span>
                    <b style="color:#1f2937">${i.n}</b><br>
                    <small style="color:#6b7280">Giá: ${i.p.toLocaleString()}đ</small><br>
                    <small style="color:#3b82f6">Sức mua: <b>${maxAfford.toLocaleString()}</b> cái</small>
                </span>
                <div style="display:flex; flex-direction: column; gap: 5px; align-items: flex-end;">
                    <div style="display:flex; gap: 5px;">
                        <input type="number" id="${id}" value="1" min="1" max="${maxAfford}" style="width:50px; border: 1px solid #d1d5db; border-radius: 4px; padding: 2px 4px;">
                        <button onclick="buyItem('${i.n}',${i.p},'${id}')" style="background:#10b981; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Mua</button>
                    </div>
                    ${maxAfford > 0 ? `<button onclick="buyMax('${i.n}',${i.p})" style="background:#3b82f6; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Mua hết (${maxAfford})</button>` : ''}
                </div>
            </div>`;
        });
    }
    document.getElementById('shop-sections-container').innerHTML = h || "Chợ hôm nay vắng vẻ...";
};

    window.toggleSellModal=(s)=>{
        if(s && !hasVisitedShop) {
            return notify("Bạn cần vào Khu Chợ khảo sát giá trước khi Ký gửi!", "err");
        }
        document.getElementById('sell-modal').style.display=s?'flex':'none';
        if(s) renderSell();
    };

    const renderSell = () => {
    // Lấy tất cả tên món đồ có trong kho HOẶC có trong danh sách chợ hôm nay
    const allPossibleItems = Array.from(new Set([...Object.keys(inventory), ...currentShopItems]));
    
    document.getElementById('sell-list-container').innerHTML = allPossibleItems.map(n => {
        let p = itemMarkets[n] || 0; // Giá thu mua (bằng 0 nếu hôm nay chợ không thu)
        let o = inventory[n] || 0;
        if (o <= 0) return ''; // Không có hàng thì không hiện

        return `
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;padding:8px;border-bottom:1px solid #eee">
                <span>
                    <b>${n}</b> (Số lượng: ${o})<br>
                    <small style="color:${p > 0 ? '#10b981' : '#ef4444'}">
                        ${p > 0 ? `Giá ký gửi: ${p.toLocaleString()}đ` : 'Hôm nay chợ không thu mua'}
                    </small>
                </span>
                ${(o > 0 && p > 0) ? `<button onclick="sellItem('${n}',${p})" style="background:#10b981;color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer">Bán tất</button>` : ''}
            </div>`;
    }).join('') || "Bạn không có hàng hóa nào trong kho.";
};

    const saveGame = () => {
    localStorage.setItem('trade_save_pro', JSON.stringify({
        cash,
        turn,
        investigatedPrices,
        currentShopItems,
        itemMarkets,
        inventory,
        market,
        labels,
        preResults, // PHẢI THÊM CÁI NÀY: Để chốt dự đoán không đổi khi F5
        hasVisitedShop, // NÊN THÊM CÁI NÀY: Để giữ trạng thái đã vào chợ hay chưa
        last: Date.now()
    }));
};
    
    const loadGame=()=>{
        let d=localStorage.getItem('trade_save_pro'); 
        if(!d) return false;
        try {
            d=JSON.parse(d); cash=d.cash; turn=d.turn; inventory=d.inventory||{};investigatedPrices = d.investigatedPrices || []; labels=d.labels||["P1"]; 
            preResults = d.preResults || {};hasVisitedShop = d.hasVisitedShop || false;
            currentShopItems = d.currentShopItems || [];
            itemMarkets = d.itemMarkets || {};
            for(let k in d.market) market[k]=d.market[k];
            let diff=Math.floor((Date.now()-d.last)/1000), ps=Math.floor(diff/TOTAL_TIME);
            if(ps>0){for(let i=0;i<Math.min(ps,10);i++) processMarket(!0);}
            timeLeft=TOTAL_TIME-(diff%TOTAL_TIME); 
            return true;
        } catch(e) { return false; }
    };

    const init = () => {
    const hasSave = loadGame();
    
    if (!hasSave) {
        preCalc(); 
        randomizeShop();
    } else {
        // Kiểm tra xem dữ liệu nạp lên đã có logic "3 đúng - 2 sai" chưa
        // Nếu chưa có hoặc là lần đầu, mới chạy preCalc
        const keys = Object.keys(market);
        if (Object.keys(preResults).length === 0 || preResults[keys[0]].isPredictionTrue === undefined) {
            preCalc();
        }
        if (currentShopItems.length === 0) randomizeShop();
    }

    // --- Giữ nguyên phần khởi tạo Chart ---
    const canvas = document.getElementById('proChart');
    if(canvas){
        const ctx=canvas.getContext('2d');
        chart=new Chart(ctx,{
            type:'line',
            data:{
                labels:labels,
                datasets:[{
                    data:market[selected].h,
                    borderColor:'#3b82f6',
                    tension:0.3,
                    fill:true,
                    backgroundColor:'rgba(59,130,246,0.1)'
                }]
            },
            options:{responsive:!0,maintainAspectRatio:!1,animation:!1,plugins:{legend:{display:!1}}}
        });
    }

    updateInv(); 
    updateDisplay();
    
    // --- Timer giữ nguyên ---
    setInterval(()=>{
        timeLeft--; 
        if(timeLeft<0) processMarket();
        const mins=Math.floor(timeLeft/60).toString().padStart(2,'0'), secs=(timeLeft%60).toString().padStart(2,'0');
        const countEl=document.getElementById('countdown');
        if(countEl) countEl.innerText=`${mins}:${secs}`;
        const barEl=document.getElementById('timer-bar');
        if(barEl) barEl.style.width=(timeLeft/TOTAL_TIME)*100+"%";
    },1000);
};

    window.onload=init;
})();