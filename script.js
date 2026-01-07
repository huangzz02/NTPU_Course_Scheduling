// ==========================================
// 全域變數定義區
// ==========================================
let mySchedule = []; // 儲存使用者已選課程的 ID 陣列
let blockedSlots = new Set(); // 儲存被屏蔽的時段（格式：'dayNum-period'）
let isDark = false; // 主題模式：false=淺色, true=深色
let currentView = 'grid'; // 目前檢視模式：'grid'=方格檢視, 'list'=列表檢視

// ==========================================
// SVG 圖示集中管理
// 用途：統一管理所有 UI 使用的 SVG 圖示，方便維護和重複使用
// ==========================================
const Icons = {
    Teacher: `<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    Add: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
    Remove: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>`,
    Note: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; position: relative; top:-1px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12" y2="17.01"></line></svg>`,
    Detail: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="8.01"></line></svg>`,
    Eval: `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
    Globe: `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:2px"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    Moon: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    Sun: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    // 修正問號下方的點顯示問題 (加入 stroke-linecap="round" stroke-linejoin="round")
    Help: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
};

// ==========================================
// 頁面初始化
// 用途：頁面載入完成後執行所有必要的初始化動作
// ==========================================
window.onload = function() {
    initTimeGrid(); // 初始化時段選擇網格
    loadFromUrl(); // 從 URL 參數載入使用者的課程選擇
    initCustomUI(); // 初始化自訂 UI 元件（下拉選單、切換按鈕等）
    renderCourses(); // 渲染課程列表
    updateWishList(); // 更新志願清單顯示

    // 檢查是否為初次訪問，若是則啟動導覽
    if (!localStorage.getItem('hasSeenV120Tour')) {
        setTimeout(() => startTour(false), 800);
        localStorage.setItem('hasSeenV120Tour', 'true');
    }
};

// ==========================================
// 網站功能導覽 (Driver.js)
// 用途：引導使用者熟悉介面操作
// ==========================================
function startTour(isForce = false) {
    const driver = window.driver.js.driver;
    
    // 定義導覽步驟
    const steps = [
        { 
            element: '#card-blocked', 
            popover: { 
                title: '屏蔽時段', 
                description: '可先在此處屏蔽衝堂或不想上的課程時段。<br>點擊格子即可切換屏蔽狀態。' 
            } 
        },
        { 
            element: '.control-panel', 
            popover: { 
                title: '控制面板', 
                description: '這裡可以做更精細的調整。<br>包含搜尋、排序、切換檢視模式，以及向度與星期篩選。' 
            } 
        },
        { 
            element: '#course-list > div:first-child', // 選擇第一個課程
            popover: { 
                title: '課程卡片', 
                description: '這裡是該課程詳細資訊。<br>• 點按 <span style="font-weight:bold">評價</span> 會自動跳轉到 Google 搜尋頁面<br>• 點按 <span style="font-weight:bold">加入</span> 則可以暫時加到志願清單' 
            } 
        },
        { 
            element: '#card-wishlist', 
            popover: { 
                title: '志願清單', 
                description: '這裡是暫時的志願排序。<br>您可以拖曳項目調整順序，也可以點選詳細資料查看完整內容。' 
            } 
        },
        { 
            element: '#help-btn', 
            popover: { 
                title: '隨時重看教學', 
                description: '需要重新觀看教學請點選此處。' 
            } 
        }
    ];

    // 如果沒有課程資料，移除第 3 步驟避免錯誤
    if (!document.querySelector('#course-list > div:first-child')) {
        steps.splice(2, 1);
    }

    const driverObj = driver({
        showProgress: true,
        steps: steps,
        nextBtnText: '下一步',
        prevBtnText: '上一步',
        doneBtnText: '完成教學', // 更改文字以更明確
        popoverClass: 'liquid-tour-popover', // 加入自訂類別
        animate: true, // 啟用動畫
        
        // 聚焦區(Highlight Stage)的外觀設定
        stagePadding: 8,  // 增加一點留白，讓格子不要貼太緊
        stageRadius: 16,  // 加大圓角：這就是您提到的「陰影區的圓角」

        // 監聽導覽銷毀事件 (用於處理「略過」或中途關閉的情況)
        onDestroyed: (element, step, { config, state }) => {
            // 如果是在最後一步之前關閉 (代表使用者按了略過或點擊遮罩關閉)
            // 且不是因為點擊「完成」按鈕 (state.activeIndex 會是最後一個索引)
            const lastStepIndex = steps.length - 1;
            
            // 如果當前步驟不是最後一步，或是強制觸發模式下需要提示
            if (state.activeIndex < lastStepIndex) {
                 // 建立一個單獨的提示，指向說明按鈕
                 const hintDriver = driver({
                     popoverClass: 'liquid-tour-popover', // 提示框也要套用自訂樣式
                     // 簡單的提示框不需要特別設定 stageRadius，因為沒有聚焦元素
                     steps: [{
                        element: '#help-btn',
                        popover: { 
                            title: '導覽已結束', 
                            description: '若需要再次觀看教學，可以隨時點擊此按鈕。',
                            side: 'bottom',
                            align: 'end'
                        }
                     }]
                 });
                 hintDriver.drive();
            }
        }
    });

    driverObj.drive();
}

// ==========================================
// 主題切換功能
// 用途：在淺色和深色主題之間切換
// ==========================================
function toggleTheme() {
    isDark = !isDark; // 切換主題狀態
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light'); // 設定 HTML 的 data-theme 屬性
    const btn = document.getElementById('theme-btn');
    btn.innerHTML = isDark ? Icons.Sun : Icons.Moon; // 更新按鈕圖示
}

// ==========================================
// 檢視模式切換
// 用途：切換課程列表的顯示模式（方格或列表）
// ==========================================
function setViewMode(mode) {
    currentView = mode; // 設定目前檢視模式
    const btnId = mode === 'grid' ? 'btn-grid' : 'btn-list';
    const btnEl = document.getElementById(btnId);
    if(btnEl) updateGlider(btnEl); // 更新滑動指示器位置
    renderCourses(); // 重新渲染課程列表
}

// ==========================================
// 更新檢視切換按鈕的滑動指示器
// 用途：視覺化顯示目前選中的檢視模式
// ==========================================
function updateGlider(el) {
    const container = document.getElementById('view-toggle');
    const glider = container.querySelector('.toggle-glider');
    
    // 移除所有按鈕的 active 狀態
    container.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active'); // 為目前按鈕加上 active 狀態
    
    // 計算並設定滑動指示器的位置和寬度
    const rect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    glider.style.width = rect.width + 'px';
    glider.style.left = (rect.left - containerRect.left) + 'px';
}

// ==========================================
// 篩選按鈕切換
// 用途：處理向度和星期篩選按鈕的啟用/停用
// ==========================================
function toggleFilter(el) {
    el.classList.toggle('active'); // 切換按鈕的 active 狀態
    renderCourses(); // 重新渲染符合篩選條件的課程
}

// ==========================================
// 初始化自訂 UI 元件
// 用途：設定檢視切換按鈕滑動效果和自訂下拉選單
// ==========================================
function initCustomUI() {
    // 初始化檢視切換滑動指示器
    const activeViewBtn = document.querySelector('#view-toggle .toggle-btn.active');
    if(activeViewBtn) updateGlider(activeViewBtn);

    // 初始化排序下拉選單
    const sortSelect = document.getElementById('sortSelect');
    const trigger = sortSelect.querySelector('.select-trigger');
    const triggerText = sortSelect.querySelector('.trigger-text');
    const options = sortSelect.querySelectorAll('.option');
    const hiddenInput = document.getElementById('sort-value');

    // 點擊下拉選單觸發器時開關選單
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        sortSelect.classList.toggle('open');
    });

    // 為每個選項加上點擊事件
    options.forEach(option => {
        option.addEventListener('click', () => {
            // 移除所有選項的 selected 狀態
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected'); // 為目前選項加上 selected 狀態
            
            // 更新顯示文字和隱藏欄位值
            const text = option.innerText.trim();
            const val = option.dataset.value;
            triggerText.innerText = `排序：${text}`;
            hiddenInput.value = val;
            
            sortSelect.classList.remove('open'); // 關閉選單
            renderCourses(); // 重新渲染課程列表
        });
    });

    // 點擊頁面其他地方時關閉下拉選單
    window.addEventListener('click', (e) => {
        if (!sortSelect.contains(e.target)) {
            sortSelect.classList.remove('open');
        }
    });
}

// ==========================================
// 初始化時段選擇網格
// 用途：建立 5 天 × 9 節課的時段選擇網格
// ==========================================
function initTimeGrid() {
    const grid = document.getElementById('time-grid');
    const days = ['一', '二', '三', '四', '五']; // 星期標題
    const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // 節次（第 1-9 節）
    
    // 建立左上角空白格
    grid.innerHTML += `<div></div>`;
    
    // 建立星期標題列
    days.forEach(d => grid.innerHTML += `<div class="grid-header">${d}</div>`);
    
    // 建立每一節課的橫列
    periods.forEach(p => {
        grid.innerHTML += `<div class="grid-header">${p}</div>`; // 節次標題
        days.forEach((d, index) => {
            const dayNum = index + 1; // 星期一=1, 星期二=2, ...
            const slotId = `${dayNum}-${p}`; // 時段 ID 格式：'1-1', '1-2', ...
            grid.innerHTML += `<div class="grid-cell" id="slot-${slotId}" onclick="toggleBlockSlot('${slotId}')"></div>`;
        });
    });
}

// ==========================================
// 切換時段的屏蔽狀態
// 用途：點擊時段網格時，加入或移除屏蔽狀態
// ==========================================
function toggleBlockSlot(slotId) {
    if (blockedSlots.has(slotId)) {
        blockedSlots.delete(slotId); // 如果已屏蔽則取消屏蔽
    } else {
        blockedSlots.add(slotId); // 如果未屏蔽則加入屏蔽
    }
    updateGridDisplay(); // 更新網格顯示
    renderCourses(); // 重新渲染課程（排除被屏蔽時段的課程）
}

// ==========================================
// 更新時段網格的視覺顯示
// 用途：根據已選課程和屏蔽時段更新網格的樣式
// ==========================================
function updateGridDisplay() {
    // 重置所有格子的樣式
    document.querySelectorAll('.grid-cell').forEach(el => el.className = 'grid-cell');
    
    // 標記已選課程的時段
    mySchedule.forEach(cid => {
        const course = rawData.find(c => c.id === cid);
        if(course) {
            const slots = parseCourseTime(course.time); // 解析課程時間
            slots.forEach(slot => {
                const el = document.getElementById(`slot-${slot}`);
                if (el) el.classList.add('cell-wishlist'); // 加上已選課程樣式
            });
        }
    });
    
    // 標記被屏蔽的時段
    blockedSlots.forEach(id => {
        const el = document.getElementById(`slot-${id}`);
        if (el) el.classList.add('cell-blocked'); // 加上屏蔽樣式
    });
}

// ==========================================
// 清除所有屏蔽時段
// 用途：重置所有時段屏蔽設定
// ==========================================
function clearBlocked() {
    if(blockedSlots.size > 0 && confirm("確定重置屏蔽？")) {
        blockedSlots.clear(); // 清空屏蔽時段集合
        updateGridDisplay(); // 更新網格顯示
        renderCourses(); // 重新渲染課程列表
    }
}

// ==========================================
// 清空志願清單
// 用途：移除所有已選課程
// ==========================================
function clearWishlist() {
    if(mySchedule.length > 0 && confirm("確定要移除所有志願課程嗎？")) {
        mySchedule = []; // 清空課程陣列
        updateUI(); // 更新所有 UI 顯示
    }
}

// ==========================================
// 課程排序邏輯
// 用途：根據使用者選擇的排序方式對課程進行排序
// ==========================================
function sortCourses(courses) {
    const sortType = document.getElementById('sort-value').value; // 取得排序類型
    
    // 向度排序優先順序對照表
    const dimOrder = {
        '向度一': 1, '向度二': 2, '向度三': 3, 
        '向度四': 4, '向度五': 5, '向度六': 6
    };

    return courses.sort((a, b) => {
        // 如果選擇「依向度」排序
        if (sortType === 'dim') {
            const dimA = dimOrder[a.dim] || 99;
            const dimB = dimOrder[b.dim] || 99;
            if (dimA !== dimB) return dimA - dimB; // 先依向度排序
        }

        // 解析時間字串為數值以便比較
        const getTimeVal = (timeStr) => {
            const dayMap = {'一':1, '二':2, '三':3, '四':4, '五':5};
            const dayMatch = timeStr.match(/[一二三四五]/);
            const day = dayMatch ? dayMap[dayMatch[0]] : 9; // 星期轉換為數字
            const numMatch = timeStr.match(/(\d+)/);
            const num = numMatch ? parseInt(numMatch[0]) : 99; // 取得節次數字
            return day * 100 + num; // 組合成可比較的數值
        };

        // 依時間排序
        const timeDiff = getTimeVal(a.time) - getTimeVal(b.time);
        if (timeDiff !== 0) return timeDiff;

        // 時間相同時，再依向度排序
        return (dimOrder[a.dim] || 99) - (dimOrder[b.dim] || 99);
    });
}

// ==========================================
// 渲染課程列表
// 用途：根據篩選條件和排序方式顯示課程
// ==========================================
function renderCourses() {
    // 取得搜尋關鍵字
    const keyword = document.getElementById('search-input').value.toLowerCase().trim();
    
    // 取得已啟用的向度篩選
    const checkedDims = Array.from(document.querySelectorAll('.chip-btn.dim-type.active')).map(btn => btn.value);
    
    // 取得已啟用的星期篩選
    const checkedDays = Array.from(document.querySelectorAll('.chip-btn.time-type.active')).map(btn => btn.value);
    
    const container = document.getElementById('course-list');

    // 篩選符合條件的課程
    let filtered = rawData.filter(c => {
        // 關鍵字篩選：課程名稱或教師名稱包含關鍵字
        const matchKey = c.name.toLowerCase().includes(keyword) || c.teacher.toLowerCase().includes(keyword);
        
        // 向度篩選：未選擇向度時顯示全部，否則只顯示選中的向度
        let matchDim = checkedDims.length === 0 || checkedDims.includes(c.dim);
        
        // 星期篩選：未選擇星期時顯示全部，否則只顯示選中的星期
        let matchDay = checkedDays.length === 0 || checkedDays.some(day => c.time.includes(day));
        
        // 屏蔽時段篩選：排除與屏蔽時段衝突的課程
        let isBlocked = false;
        if (blockedSlots.size > 0) {
            const courseSlots = parseCourseTime(c.time);
            isBlocked = courseSlots.some(x => blockedSlots.has(x));
        }
        
        return matchKey && matchDim && matchDay && !isBlocked;
    });

    // 排序篩選後的課程
    filtered = sortCourses(filtered);
    
    // 顯示搜尋結果數量
    document.getElementById('result-count').innerText = `搜尋結果：${filtered.length} 筆`;

    let html = '';
    
    // 無符合資料時顯示提示訊息
    if (filtered.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-4 text-muted">無符合資料</div>';
        return;
    }

    // 建立每個課程的 HTML
    filtered.forEach(c => {
        const isAdded = mySchedule.includes(c.id); // 檢查是否已加入志願
        
        // 向度顏色對照表
        const dimColors = {
            '向度一':'#ff6b6b', '向度二':'#f97316', '向度三':'#2ed573', 
            '向度四':'#1dd1a1', '向度五':'#5352ed', '向度六':'#3742fa'
        };
        const dimColor = dimColors[c.dim] || '#ccc';
        
        const balance = c.limit - c.enrolled; // 計算剩餘名額
        const hasNote = c.note && c.note.trim() !== ''; // 檢查是否有備註

        // 授課語言圖示（地球圖示 + 文字）
        const langIcon = c.lang.includes('英') ? `${Icons.Globe} 英` : `${Icons.Globe} 中`;
        
        // 課程資訊字串（時間 | 地點 | 學分 | 餘額）
        const infoString = `${c.time} &nbsp;|&nbsp; ${c.room} &nbsp;|&nbsp; ${c.credit}學分 &nbsp;|&nbsp; 餘${balance} (${c.enrolled}/${c.limit})`;

        // 操作按鈕：已加入顯示「移除」，未加入顯示「加入」
        const actionBtn = isAdded 
            ? `<button class="btn btn-primary" style="background:#dc3545; border-color:#dc3545;" onclick="toggleSchedule('${c.id}')" title="移除">${Icons.Remove} 移除</button>`
            : `<button class="btn btn-primary" onclick="toggleSchedule('${c.id}')" title="加入">${Icons.Add} 加入</button>`;

        // 詳細資料按鈕
        const detailBtn = `<button class="btn btn-ghost btn-icon" onclick="showCourseDetail('${c.id}')" title="詳細資料">${Icons.Detail}</button>`;
        
        // 評價搜尋按鈕
        const evalBtn = `<a href="https://www.google.com/search?q=台北大學+${c.name}+評價" target="_blank" class="btn btn-ghost">評價 ${Icons.Eval}</a>`;
        
        // 加簽標籤
        const addTag = c.can_add === '是' 
            ? `<span class="tag-add">✓ 可加簽</span>` 
            : `<span class="badge" style="background:var(--bg-base); color:var(--text-muted); border:1px solid var(--border); margin-left:8px; font-weight:normal;">不可加簽</span>`;

        // 方格檢視模式
        if (currentView === 'grid') {
            // 備註區塊（有備註時才顯示）
            const noteHtml = hasNote ? `
                <div class="card-note-wrapper">
                    <div class="note-box">
                        ${Icons.Note}
                        <div>${c.note}</div>
                    </div>
                </div>` : '';

            html += `
            <div class="col-md-6 col-12">
                <div class="card-view-item" style="--dim-color: ${dimColor}">
                    <header class="card-header-custom">
                        <div class="card-meta-row">
                            <div>
                                <span class="badge badge-dim">${c.dim}</span>
                                <span class="badge badge-lang">${langIcon}</span>
                            </div>
                            <span class="card-id">${c.id}</span>
                        </div>
                        <h3>${c.name}</h3>
                        <div class="card-teacher">
                            ${Icons.Teacher}
                            ${c.teacher}
                        </div>
                    </header>

                    <div class="card-info-box">
                        ${infoString}
                    </div>

                    ${noteHtml}

                    <footer class="card-footer-custom">
                        <div class="status-tags">
                            ${addTag}
                        </div>
                        <div class="list-actions">
                            ${evalBtn}
                            ${actionBtn}
                        </div>
                    </footer>
                </div>
            </div>`;
        } else {
            // 列表檢視模式
            
            // 備註框（完整展示）
            const noteBox = hasNote ? `
                <div class="list-note-box mt-2">
                    <div class="note-box">
                        ${Icons.Note}
                        <div>${c.note}</div>
                    </div>
                </div>` : '';

            html += `
            <div class="col-12">
                <div class="list-item" style="--dim-color: ${dimColor}; flex-wrap: wrap;">
                    <div class="list-info-group w-100">
                        <span class="badge badge-dim">${c.dim}</span>
                        
                        <div class="list-content w-100">
                            <div class="list-title">
                                <span class="text">${c.name}</span>${addTag}
                            </div>
                            
                            <div class="list-meta d-flex align-items-center text-muted small mt-1">
                                <span class="me-3 text-dark fw-bold">${c.teacher}</span>
                                <span>${infoString}</span>
                            </div>

                            ${noteBox}
                        </div>
                    </div>
                    
                    <div class="list-actions d-flex gap-2">
                        ${evalBtn}
                        ${actionBtn}
                    </div>
                </div>
            </div>`;
        }
    });
    
    container.innerHTML = html; // 更新課程列表 HTML
}

// ==========================================
// 切換課程的加入/移除狀態
// 用途：點擊「加入」或「移除」按鈕時的處理
// ==========================================
function toggleSchedule(courseId) {
    // 移除按鈕的焦點狀態（避免按鈕持續顯示焦點框）
    if(document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
    
    const index = mySchedule.indexOf(courseId);
    if (index > -1) {
        mySchedule.splice(index, 1); // 已存在則移除
    } else {
        mySchedule.push(courseId); // 不存在則加入
    }
    
    updateUI(); // 更新所有相關 UI
}

// ==========================================
// 更新所有 UI 顯示
// 用途：當課程選擇或屏蔽設定改變時，同步更新所有相關介面
// ==========================================
function updateUI() {
    updateGridDisplay(); // 更新時段網格
    renderCourses(); // 重新渲染課程列表
    updateWishList(); // 更新志願清單
    updateUrl(); // 更新瀏覽器網址列
}

// ==========================================
// 更新志願清單顯示
// 用途：顯示使用者已選的課程清單，支援拖曳排序
// ==========================================
function updateWishList() {
    const list = document.getElementById('wish-list');
    
    // 更新課程數量顯示
    document.getElementById('wish-count').innerText = `${mySchedule.length} 門`;

    // 清單為空時顯示提示訊息
    if (mySchedule.length === 0) {
        list.innerHTML = '<li class="list-group-item text-muted text-center py-4 rounded" style="background: var(--bg-base); border: 1px dashed var(--border);">尚未加入課程</li>';
        return;
    }
    
    let html = '';
    
    // 建立每個課程的清單項目
    mySchedule.forEach((cid, index) => {
        const c = rawData.find(x => x.id === cid);
        if (!c) return; // 找不到課程資料則跳過
        
        html += `
        <li class="list-group-item draggable-item d-flex justify-content-between align-items-center px-2 py-2 mb-1" 
            draggable="true" data-id="${c.id}" 
            style="background: var(--bg-elevated); border: 1px solid var(--border);">
            <div class="d-flex align-items-center" style="width: 75%;">
                <div class="rank-badge flex-shrink-0" style="margin-right:10px; font-weight:bold; color:var(--text-gray);">${index + 1}.</div>
                <div class="flex-grow-1" style="min-width:0;">
                    <div class="fw-bold text-truncate" style="font-size: 0.95rem; color: var(--text-dark);">
                        ${c.name}
                    </div>
                    <small class="text-muted d-block text-truncate">
                        ${c.dim} | ${c.teacher} | ${c.time}
                    </small>
                </div>
            </div>
            <div class="d-flex align-items-center gap-1">
                <button class="btn-info-wish" onclick="showCourseDetail('${c.id}')" title="詳細資料">${Icons.Detail}</button>
                <button class="btn-remove-wish" onclick="toggleSchedule('${c.id}')" title="移除">${Icons.Remove}</button>
            </div>
        </li>`;
    });
    
    list.innerHTML = html;
    addDragEvents(); // 加上拖曳事件監聽
}

// ==========================================
// 加上拖曳排序功能
// 用途：為志願清單項目加上拖曳排序的事件監聽
// ==========================================
function addDragEvents() {
    const list = document.getElementById('wish-list');
    let draggedItem = null; // 記錄目前被拖曳的項目

    list.querySelectorAll('.draggable-item').forEach(item => {
        // 桌面端拖曳事件
        item.addEventListener('dragstart', function() {
            draggedItem = item;
            setTimeout(() => item.style.opacity = '0.5', 0); // 設定半透明效果
        });
        
        item.addEventListener('dragend', handleDragEnd);
        
        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            const afterElement = getDragAfterElement(list, e.clientY);
            if (afterElement == null) {
                list.appendChild(draggedItem); // 插入到最後
            } else {
                list.insertBefore(draggedItem, afterElement); // 插入到指定位置
            }
        });

        // 行動裝置觸控事件
        item.addEventListener('touchstart', function(e) {
            // 如果點擊的是按鈕則不觸發拖曳
            if(e.target.closest('.btn-remove-wish') || e.target.closest('.btn-info-wish')) return;
            draggedItem = item;
            item.style.opacity = '0.5';
            item.style.background = 'var(--grid-hover)';
        }, {passive: false});

        item.addEventListener('touchmove', function(e) {
            if (!draggedItem) return;
            e.preventDefault();
            const touch = e.touches[0];
            const afterElement = getDragAfterElement(list, touch.clientY);
            if (afterElement == null) {
                list.appendChild(draggedItem);
            } else {
                list.insertBefore(draggedItem, afterElement);
            }
        }, {passive: false});

        item.addEventListener('touchend', handleDragEnd);
    });

    // 拖曳結束的處理函數
    function handleDragEnd() {
        if(draggedItem) {
            // 恢復原始樣式
            draggedItem.style.opacity = '1';
            draggedItem.style.background = 'var(--bg-elevated)';
        }
        draggedItem = null;
        
        // 取得新的排序並更新資料
        const newIds = Array.from(list.querySelectorAll('.draggable-item')).map(el => el.dataset.id);
        if(JSON.stringify(mySchedule) !== JSON.stringify(newIds)) {
            mySchedule = newIds;
            updateUI();
        }
    }
}

// ==========================================
// 計算拖曳時的插入位置
// 用途：根據滑鼠/手指的 Y 座標，計算應該插入的位置
// ==========================================
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable-item:not([style*="opacity: 0.5"])')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2; // 計算與元素中心的距離
        
        // 找出最接近的元素
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ==========================================
// 解析課程時間字串
// 用途：將「週三5~6」這樣的時間字串轉換為時段 ID 陣列
// 回傳格式：['3-5', '3-6']
// ==========================================
function parseCourseTime(timeStr) {
    if (!timeStr) return [];
    
    // 星期對應數字
    const dayMap = {'一':1, '二':2, '三':3, '四':4, '五':5};
    
    // 找出星期幾
    const dayMatch = timeStr.match(/[一二三四五]/);
    if (!dayMatch) return [];
    const dayNum = dayMap[dayMatch[0]];
    
    let slots = [];
    
    // 處理範圍格式（如「5~6」或「5-6」）
    const rangeMatch = timeStr.match(/(\d+)[~-](\d+)/);
    if (rangeMatch) {
        for (let i = parseInt(rangeMatch[1]); i <= parseInt(rangeMatch[2]); i++) {
            slots.push(`${dayNum}-${i}`);
        }
    } else {
        // 處理單一節次或多個節次（如「5」或「5,7」）
        const numMatch = timeStr.match(/(\d+)/g);
        if (numMatch) {
            numMatch.forEach(n => slots.push(`${dayNum}-${n}`));
        }
    }
    
    return slots;
}

// ==========================================
// 更新瀏覽器網址列
// 用途：將使用者的課程選擇編碼到 URL 參數中，方便分享
// ==========================================
function updateUrl() {
    const params = new URLSearchParams();
    if (mySchedule.length > 0) {
        params.set('ids', mySchedule.join(',')); // 將課程 ID 陣列轉為逗號分隔字串
    }
    window.history.replaceState({}, '', `${location.pathname}?${params}`);
}

// ==========================================
// 從 URL 參數載入課程選擇
// 用途：頁面載入時，從 URL 參數還原使用者之前的課程選擇
// ==========================================
function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const ids = params.get('ids');
    if (ids) {
        // 過濾出有效的課程 ID
        mySchedule = ids.split(',').filter(id => rawData.some(c => c.id === id));
    }
}

// ==========================================
// 複製分享連結
// 用途：複製目前網址到剪貼簿，方便分享給其他人
// ==========================================
function copyShareLink() {
    // Google Analytics 事件追蹤
    if(typeof gtag === 'function') {
        gtag('event', 'share_link_clicked', {
            'event_category': 'engagement',
            'event_label': 'Share Button'
        });
    }
    
    // 複製網址到剪貼簿
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert('連結已複製！\n\n您可以將此連結傳給朋友，他們點開後就會看到您目前的志願排序喔！');
    });
}

// ==========================================
// 顯示課程詳細資料彈窗
// 用途：點擊「詳細資料」按鈕時，顯示課程的完整資訊
// ==========================================
function showCourseDetail(courseId) {
    const c = rawData.find(x => x.id === courseId);
    if (!c) return;

    const dimColors = {
        '向度一':'#ff6b6b', '向度二':'#f97316', '向度三':'#2ed573', 
        '向度四':'#1dd1a1', '向度五':'#5352ed', '向度六':'#3742fa'
    };
    const dimColor = dimColors[c.dim] || '#f97316';
    
    const dimWrapper = document.getElementById('modalDimWrapper');
    dimWrapper.innerText = c.dim;
    dimWrapper.style.setProperty('--dim-color', dimColor);
    dimWrapper.style.color = dimColor;
    dimWrapper.style.borderColor = dimColor;

    document.getElementById('modalTitle').innerText = c.name;
    document.getElementById('modalId').innerText = c.id;
    document.getElementById('modalTeacher').innerText = c.teacher;
    document.getElementById('modalTime').innerText = c.time;
    document.getElementById('modalRoom').innerText = c.room || '未定';
    document.getElementById('modalCredit').innerText = c.credit + ' 學分';
    
    const balance = c.limit - c.enrolled;
    document.getElementById('modalQuotaGroup').innerText = `餘${balance} (${c.enrolled}/${c.limit})`;
    
    document.getElementById('modalLang').innerText = c.lang.includes('英') ? '英語' : '中文';
    
    document.getElementById('modalCanAdd').innerText = c.can_add === '是' ? '可加簽' : '不可加簽';
    
    document.getElementById('modalSearchBtn').href = `https://www.google.com/search?q=台北大學+${c.name}+評價`;

    const noteContainer = document.getElementById('modalNoteContainer');
    if (c.note && c.note.trim() !== '') {
        document.getElementById('modalNote').innerText = c.note;
        noteContainer.classList.remove('d-none');
    } else {
        noteContainer.classList.add('d-none');
    }

    const modal = document.getElementById('courseDetailModal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('courseDetailModal');
    modal.classList.remove('active');
    
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('courseDetailModal');
        if (modal.classList.contains('active')) {
            closeModal();
        }
    }
});