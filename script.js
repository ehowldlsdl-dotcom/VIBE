// [기존 Todo List 상태 및 로직 전체 유지]
let currentView = 'week';
let currentDisplay = 'grid';
let currentDate = new Date();
let selectedDateStr = formatDate(new Date());

let todoData = JSON.parse(localStorage.getItem('pastel_todo_pro_data')) || {};
const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

document.addEventListener('DOMContentLoaded', () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if(document.getElementById('export-start')) {
        document.getElementById('export-start').value = formatDate(new Date(year, month, 1));
    }
    if(document.getElementById('export-end')) {
        document.getElementById('export-end').value = formatDate(new Date(year, month + 1, 0));
    }

    renderWorkspace();
    renderTodoList();
});

// 메인 앱 서비스 토글 핸들러 (Todo <-> Note)
function switchAppTab(tabName) {
    document.querySelectorAll('.app-section').forEach(sec => sec.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    if (tabName === 'todo') {
        document.getElementById('app-section-todo').style.display = 'block';
        document.getElementById('tab-todo').classList.add('active');
        renderWorkspace();
    } else if (tabName === 'note') {
        document.getElementById('app-section-note').style.display = 'block';
        document.getElementById('tab-note').classList.add('active');
        if (typeof initNoteApp === 'function') initNoteApp();
    } else if (tabName === 'weather') {
        document.getElementById('app-section-weather').style.display = 'block';
        document.getElementById('tab-weather').classList.add('active');
        if (typeof initWeatherApp === 'function') initWeatherApp();
    } else if (tabName === 'exchange') {
        document.getElementById('app-section-exchange').style.display = 'block';
        document.getElementById('tab-exchange').classList.add('active');
        if (typeof initExchangeApp === 'function') initExchangeApp();
    }
}

function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function switchView(view) {
    currentView = view;
    document.getElementById('btn-view-week').classList.toggle('active', view === 'week');
    document.getElementById('btn-view-month').classList.toggle('active', view === 'month');
    renderWorkspace();
}

function switchDisplayType(type) {
    currentDisplay = type;
    document.getElementById('btn-type-grid').classList.toggle('active', type === 'grid');
    document.getElementById('btn-type-list').classList.toggle('active', type === 'list');
    renderWorkspace();
}

function moveDate(direction) {
    if (currentView === 'week') {
        currentDate.setDate(currentDate.getDate() + (direction * 7));
    } else {
        currentDate.setMonth(currentDate.getMonth() + direction);
    }
    renderWorkspace();
}

function renderWorkspace() {
    const workspace = document.getElementById('display-workspace');
    if(!workspace) return;
    workspace.innerHTML = '';

    if (currentDisplay === 'grid') {
        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'calendar-grid-wrapper';
        
        const gridHeader = document.createElement('div');
        gridHeader.className = 'grid-header';
        gridHeader.id = 'grid-weekdays';
        gridHeader.style.gridTemplateColumns = 'repeat(7, 1fr)';
        gridHeader.innerHTML = weekdays.map(w => `<div>${w}</div>`).join('');
        
        const daysContainer = document.createElement('div');
        daysContainer.className = 'days-container';
        daysContainer.style.gridTemplateColumns = 'repeat(7, 1fr)';

        gridWrapper.appendChild(gridHeader);
        gridWrapper.appendChild(daysContainer);
        workspace.appendChild(gridWrapper);

        if (currentView === 'week') {
            renderGridWeek(daysContainer);
        } else {
            renderGridMonth(daysContainer);
        }
    } else {
        const tableView = document.createElement('div');
        tableView.className = 'table-view-container';
        
        const table = document.createElement('table');
        table.className = 'todo-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th style="width: 130px;">날짜</th>
                    <th style="width: 70px;">요일</th>
                    <th>할 일 목록 (토글 가능)</th>
                </tr>
            </thead>
            <tbody id="table-view-body"></tbody>
        `;
        tableView.appendChild(table);
        workspace.appendChild(tableView);

        const tbody = document.getElementById('table-view-body');
        if (currentView === 'week') {
            renderListWeek(tbody);
        } else {
            renderListMonth(tbody);
        }
    }

    drawProgressChart();
}

function renderGridWeek(container) {
    const startOfWeek = getStartOfWeek(currentDate);
    document.getElementById('current-period-text').innerText = 
        `${startOfWeek.getFullYear()}년 ${String(startOfWeek.getMonth() + 1).padStart(2, '0')}월`;

    for (let i = 0; i < 7; i++) {
        const tempDate = new Date(startOfWeek);
        tempDate.setDate(startOfWeek.getDate() + i);
        createDayCard(tempDate, container, formatDate(new Date()), false);
    }
}

function renderGridMonth(container) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    document.getElementById('current-period-text').innerText = `${year}년 ${String(month + 1).padStart(2, '0')}월`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const todayStr = formatDate(new Date());

    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const tempDate = new Date(year, month - 1, prevMonthLast - i);
        createDayCard(tempDate, container, todayStr, true);
    }

    for (let i = 1; i <= totalDays; i++) {
        const tempDate = new Date(year, month, i);
        createDayCard(tempDate, container, todayStr, false);
    }

    const finalSlots = (startDayOfWeek + totalDays) > 35 ? 42 : 35;
    const nextSlots = finalSlots - (startDayOfWeek + totalDays);
    for (let i = 1; i <= nextSlots; i++) {
        const tempDate = new Date(year, month + 1, i);
        createDayCard(tempDate, container, todayStr, true);
    }
}

function createDayCard(date, container, todayStr, isOtherMonth) {
    const dateStr = formatDate(date);
    const card = document.createElement('div');
    card.className = `day-card`;
    
    if (isOtherMonth) card.classList.add('other-month');
    if (dateStr === todayStr) card.classList.add('today');
    if (dateStr === selectedDateStr) card.classList.add('active');
    
    card.onclick = () => selectDate(dateStr);

    let miniTodoListHtml = '';
    if (todoData[dateStr] && todoData[dateStr].length > 0) {
        miniTodoListHtml = `<ul class="mini-todo-list">`;
        todoData[dateStr].slice(0, 2).forEach(todo => {
            miniTodoListHtml += `
                <li class="mini-todo-item ${todo.completed ? 'completed' : ''}">
                    <i class="${todo.completed ? 'fa-solid fa-check' : 'fa-regular fa-square'}"></i> ${todo.text}
                </li>`;
        });
        if (todoData[dateStr].length > 2) {
            miniTodoListHtml += `<li class="mini-todo-item" style="background:none; color:var(--dark-pink); font-size:9.5px; padding:0">+${todoData[dateStr].length - 2}개</li>`;
        }
        miniTodoListHtml += `</ul>`;
    }

    card.innerHTML = `
        <div class="day-number">${date.getDate()}</div>
        ${miniTodoListHtml}
    `;
    container.appendChild(card);
}

function renderListWeek(tbody) {
    const startOfWeek = getStartOfWeek(currentDate);
    document.getElementById('current-period-text').innerText = 
        `${startOfWeek.getFullYear()}년 ${String(startOfWeek.getMonth() + 1).padStart(2, '0')}월`;

    for (let i = 0; i < 7; i++) {
        const tempDate = new Date(startOfWeek);
        tempDate.setDate(startOfWeek.getDate() + i);
        createTableRow(tempDate, tbody);
    }
}

function renderListMonth(tbody) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    document.getElementById('current-period-text').innerText = `${year}년 ${String(month + 1).padStart(2, '0')}월`;

    const totalDays = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= totalDays; i++) {
        const tempDate = new Date(year, month, i);
        createTableRow(tempDate, tbody);
    }
}

function createTableRow(date, tbody) {
    const dateStr = formatDate(date);
    const tr = document.createElement('tr');
    if (dateStr === selectedDateStr) tr.className = 'active';

    const todos = todoData[dateStr] || [];
    let todoTagsHtml = '';
    
    if (todos.length > 0) {
        todos.forEach(todo => {
            todoTagsHtml += `
                <div class="table-todo-item ${todo.completed ? 'completed' : ''}" onclick="toggleTodoDirectly('${dateStr}', '${todo.id}', event)">
                    <i class="${todo.completed ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}"></i>
                    <span>${todo.text}</span>
                </div>`;
        });
    } else {
        todoTagsHtml = `<span style="color:var(--text-light); font-size:12px; font-style:italic;">등록된 일정 없음</span>`;
    }

    tr.onclick = () => selectDate(dateStr);
    tr.style.cursor = 'pointer';

    const dayClass = date.getDay() === 0 ? 'style="color:red;"' : (date.getDay() === 6 ? 'style="color:blue;"' : '');

    tr.innerHTML = `
        <td><strong>${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}</strong></td>
        <td ${dayClass}>${weekdays[date.getDay()]}요일</td>
        <td>${todoTagsHtml}</td>
    `;
    tbody.appendChild(tr);
}

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
}

function selectDate(dateStr) {
    selectedDateStr = dateStr;
    renderWorkspace();
    renderTodoList();
}

function renderTodoList() {
    const title = document.getElementById('selected-date-title');
    const listContainer = document.getElementById('main-todo-list');
    if(!title || !listContainer) return;
    const [y, m, d] = selectedDateStr.split('-');
    
    title.innerHTML = `<span><i class="fa-regular fa-star"></i> ${y}년 ${m}월 ${d}일 계획 관리</span>`;
    listContainer.innerHTML = '';

    const list = todoData[selectedDateStr] || [];

    if (list.length === 0) {
        listContainer.innerHTML = `<li class="empty-msg">일정이 없습니다. 새로운 할 일을 추가하여 하루를 채워보세요!💖</li>`;
        return;
    }

    list.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <div class="todo-item-left" onclick="toggleTodo('${todo.id}')">
                <span class="todo-checkbox">
                    <i class="${todo.completed ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}"></i>
                </span>
                <span class="todo-text">${todo.text}</span>
            </div>
            <button class="delete-btn" onclick="deleteTodo('${todo.id}')">
                <i class="fa-regular fa-trash-can"></i>
            </button>
        `;
        listContainer.appendChild(li);
    });
}

function addTodo() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    if (!text) return;

    if (!todoData[selectedDateStr]) {
        todoData[selectedDateStr] = [];
    }

    const newTodo = {
        id: 'todo_' + Date.now(),
        text: text,
        completed: false
    };

    todoData[selectedDateStr].push(newTodo);
    saveAndRefresh();
    input.value = '';
}

function handleKeyPress(e) {
    if (e.key === 'Enter') addTodo();
}

function toggleTodoDirectly(dateKey, id, event) {
    event.stopPropagation(); 
    todoData[dateKey] = todoData[dateKey].map(t => {
        if (t.id === id) t.completed = !t.completed;
        return t;
    });
    saveAndRefresh();
}

// 하단 리스트 체크 인버전 토글러
function toggleTodo(id) {
    todoData[selectedDateStr] = todoData[selectedDateStr].map(todo => {
        if (todo.id === id) todo.completed = !todo.completed;
        return todo;
    });
    saveAndRefresh();
}

function deleteTodo(id) {
    todoData[selectedDateStr] = todoData[selectedDateStr].filter(todo => todo.id !== id);
    if (todoData[selectedDateStr].length === 0) {
        delete todoData[selectedDateStr];
    }
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem('pastel_todo_pro_data', JSON.stringify(todoData));
    renderWorkspace();
    renderTodoList();
}

function drawProgressChart() {
    const canvas = document.getElementById('progressCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 35;

    let total = 0;
    let completed = 0;
    const datesToCheck = [];

    if (currentView === 'week') {
        if(document.getElementById('analytics-title')) document.getElementById('analytics-title').innerText = '이번 주 계획 달성도';
        const start = getStartOfWeek(currentDate);
        for (let i = 0; i < 7; i++) {
            const tmp = new Date(start);
            tmp.setDate(start.getDate() + i);
            datesToCheck.push(formatDate(tmp));
        }
    } else {
        if(document.getElementById('analytics-title')) document.getElementById('analytics-title').innerText = '이번 달 계획 달성도';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const totalDays = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= totalDays; i++) {
            datesToCheck.push(formatDate(new Date(year, month, i)));
        }
    }

    datesToCheck.forEach(d => {
        if (todoData[d]) {
            todoData[d].forEach(t => {
                total++;
                if (t.completed) completed++;
            });
        }
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    if(document.getElementById('analytics-desc')) {
        document.getElementById('analytics-desc').innerText = 
            total > 0 ? `현재까지 총 ${total}개의 일정 중 ${completed}개를 이행했습니다.` : '현재 기간에 설정된 계획이 없습니다.';
    }

    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffe5ec';
    ctx.lineWidth = 8;
    ctx.stroke();

    if (percent > 0) {
        ctx.beginPath();
        const startAngle = -0.5 * Math.PI; 
        const endAngle = startAngle + (percent / 100) * 2 * Math.PI;
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = '#ffb7b2';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    ctx.fillStyle = '#f7a399';
    ctx.font = 'bold 15px Noto Sans KR';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${percent}%`, centerX, centerY);
}

function exportToExcel() {
    const startVal = document.getElementById('export-start').value;
    const endVal = document.getElementById('export-end').value;

    if (!startVal || !endVal) {
        alert('시작일과 종료일을 정확히 입력해 주세요. 📅');
        return;
    }

    const startDate = new Date(startVal);
    const endDate = new Date(endVal);

    if (startDate > endDate) {
        alert('종료일은 시작일보다 빠를 수 없습니다. ⚠️');
        return;
    }

    const excelRows = [];
    let tempDate = new Date(startDate);
    
    while (tempDate <= endDate) {
        const dateStr = formatDate(tempDate);
        const list = todoData[dateStr] || [];
        
        if (list.length > 0) {
            list.forEach(todo => {
                excelRows.push({
                    '날짜': dateStr,
                    '할 일 내용': todo.text,
                    '완료여부(Y/N)': todo.completed ? 'Y' : 'N'
                });
            });
        } else {
            excelRows.push({
                '날짜': dateStr,
                '할 일 내용': '',
                '완료여부(Y/N)': ''
            });
        }
        tempDate.setDate(tempDate.getDate() + 1);
    }

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Todo List");

    worksheet['!cols'] = [{ wch: 15 }, { wch: 35 }, { wch: 15 }];
    const filename = `Todo_Report_${startVal}_to_${endVal}.xlsx`;
    XLSX.writeFile(workbook, filename);
}

function importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet);
            
            if (rows.length === 0) {
                alert('파싱 가능한 데이터가 엑셀 파일 내에 없습니다.');
                return;
            }

            let importCount = 0;
            rows.forEach(row => {
                let dateKey = row['날짜'] || row['Date'] || row['날짜(YYYY-MM-DD)'];
                if (typeof dateKey === 'number') {
                    const parsedDate = XLSX.SSF.parse_date_code(dateKey);
                    dateKey = `${parsedDate.y}-${String(parsedDate.m).padStart(2, '0')}-${String(parsedDate.d).padStart(2, '0')}`;
                }

                const todoText = row['할 일 내용'] || row['할일'] || row['Todo'] || row['Task'];
                const completedVal = row['완료여부(Y/N)'] || row['완료'] || row['Status'];

                if (dateKey && todoText && todoText.trim() !== '') {
                    const isCompleted = (completedVal === 'Y' || completedVal === 'y' || completedVal === '완료' || completedVal === true || completedVal === 'true');

                    if (!todoData[dateKey]) todoData[dateKey] = [];
                    const isDuplicated = todoData[dateKey].some(t => t.text === todoText.trim());
                    
                    if (!isDuplicated) {
                        todoData[dateKey].push({
                            id: 'todo_' + Date.now() + Math.random().toString(36).substr(2, 4),
                            text: todoText.trim(),
                            completed: isCompleted
                        });
                        importCount++;
                    }
                }
            });

            if (importCount > 0) {
                saveAndRefresh();
                alert(`엑셀 파일 분석 완료! 새로운 일정 ${importCount}개가 성공적으로 업데이트되었습니다. 🌸`);
            } else {
                alert('가져올 새로운 일정이 없습니다. ⚠️');
            }
        } catch (err) {
            alert('엑셀 파일 읽기 도중 에러가 발생했습니다.');
        } finally {
            document.getElementById('excel-file').value = '';
        }
    };
    reader.readAsArrayBuffer(file);
}


// =========================================================
// 서울시 기온 및 미세먼지 체크 모듈 (Open-Meteo API)
// =========================================================
const SEOUL_DISTRICTS = [
    { name: '종로구', lat: 37.5735, lon: 126.9788, row: 2, col: 4 },
    { name: '중구', lat: 37.5636, lon: 126.9976, row: 3, col: 4 },
    { name: '용산구', lat: 37.5326, lon: 126.9905, row: 4, col: 4 },
    { name: '성동구', lat: 37.5633, lon: 127.0369, row: 3, col: 5 },
    { name: '광진구', lat: 37.5384, lon: 127.0822, row: 4, col: 6 },
    { name: '동대문구', lat: 37.5744, lon: 127.0396, row: 2, col: 5 },
    { name: '중랑구', lat: 37.6063, lon: 127.0927, row: 1, col: 6 },
    { name: '성북구', lat: 37.5894, lon: 127.0167, row: 1, col: 4 },
    { name: '강북구', lat: 37.6396, lon: 127.0257, row: 0, col: 4 },
    { name: '도봉구', lat: 37.6688, lon: 127.0471, row: 0, col: 5 },
    { name: '노원구', lat: 37.6542, lon: 127.0568, row: 0, col: 6 },
    { name: '은평구', lat: 37.6176, lon: 126.9227, row: 1, col: 2 },
    { name: '서대문구', lat: 37.5791, lon: 126.9368, row: 2, col: 3 },
    { name: '마포구', lat: 37.5663, lon: 126.9019, row: 3, col: 2 },
    { name: '양천구', lat: 37.5169, lon: 126.8664, row: 5, col: 1 },
    { name: '강서구', lat: 37.5509, lon: 126.8495, row: 4, col: 0 },
    { name: '구로구', lat: 37.4955, lon: 126.8877, row: 6, col: 1 },
    { name: '금천구', lat: 37.4569, lon: 126.8955, row: 7, col: 2 },
    { name: '영등포구', lat: 37.5264, lon: 126.8963, row: 5, col: 2 },
    { name: '동작구', lat: 37.5124, lon: 126.9393, row: 5, col: 3 },
    { name: '관악구', lat: 37.4784, lon: 126.9516, row: 7, col: 3 },
    { name: '서초구', lat: 37.4837, lon: 127.0324, row: 6, col: 4 },
    { name: '강남구', lat: 37.5172, lon: 127.0473, row: 5, col: 5 },
    { name: '송파구', lat: 37.5145, lon: 127.1059, row: 5, col: 6 },
    { name: '강동구', lat: 37.5301, lon: 127.1238, row: 4, col: 7 }
];

let weatherCache = {};
let selectedWeatherDistrict = '중구';
let weatherRefreshTimer = null;
let weatherIsLoading = false;

function initWeatherApp() {
    renderSeoulMap();
    renderWeatherTable();
    if (Object.keys(weatherCache).length === 0) {
        refreshWeatherData(false);
    }
    if (!weatherRefreshTimer) {
        weatherRefreshTimer = setInterval(() => refreshWeatherData(false), 5 * 60 * 1000);
    }
}

function renderSeoulMap() {
    const map = document.getElementById('seoul-map');
    if (!map) return;
    map.innerHTML = '';

    SEOUL_DISTRICTS.forEach(district => {
        const info = weatherCache[district.name] || {};
        const pm25 = Number(info.pm25);
        const airClass = getAirQualityClass(pm25);
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = `district-tile ${airClass.className} ${selectedWeatherDistrict === district.name ? 'active' : ''}`;
        tile.style.gridRow = String(district.row + 1);
        tile.style.gridColumn = String(district.col + 1);
        tile.onclick = () => selectWeatherDistrict(district.name);
        tile.innerHTML = `
            <strong>${district.name}</strong>
            <span>${formatWeatherValue(info.temperature, '°C')}</span>
            <small>PM2.5 ${formatWeatherValue(info.pm25, '㎍/㎥')}</small>
        `;
        map.appendChild(tile);
    });
}

function selectWeatherDistrict(name) {
    selectedWeatherDistrict = name;
    renderSeoulMap();
    renderWeatherDetail();
}

async function refreshWeatherData(showAlert) {
    if (weatherIsLoading) return;
    weatherIsLoading = true;
    updateWeatherStatus('Open-Meteo에서 서울시 날씨와 대기질 데이터를 불러오는 중입니다...', false);

    const latitudes = SEOUL_DISTRICTS.map(d => d.lat).join(',');
    const longitudes = SEOUL_DISTRICTS.map(d => d.lon).join(',');
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FSeoul`;
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitudes}&longitude=${longitudes}&hourly=pm10,pm2_5,us_aqi&timezone=Asia%2FSeoul&forecast_days=1`;

    try {
        const [weatherResponse, airResponse] = await Promise.all([fetch(weatherUrl), fetch(airUrl)]);
        if (!weatherResponse.ok || !airResponse.ok) throw new Error('API 응답 상태가 올바르지 않습니다.');

        const weatherJson = await weatherResponse.json();
        const airJson = await airResponse.json();
        const weatherItems = Array.isArray(weatherJson) ? weatherJson : [weatherJson];
        const airItems = Array.isArray(airJson) ? airJson : [airJson];

        SEOUL_DISTRICTS.forEach((district, index) => {
            const current = weatherItems[index]?.current || {};
            const airLatest = pickLatestAirQuality(airItems[index]?.hourly || {});
            weatherCache[district.name] = {
                ...district,
                temperature: current.temperature_2m,
                humidity: current.relative_humidity_2m,
                windSpeed: current.wind_speed_10m,
                weatherCode: current.weather_code,
                weatherText: getWeatherText(current.weather_code),
                weatherTime: current.time,
                pm25: airLatest.pm25,
                pm10: airLatest.pm10,
                aqi: airLatest.aqi,
                airTime: airLatest.time
            };
        });

        const now = new Date();
        const updatedText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} 갱신`;
        const updatedEl = document.getElementById('weather-last-updated');
        if (updatedEl) updatedEl.innerText = updatedText;
        updateWeatherStatus('서울시 날씨·미세먼지 정보가 최신 데이터로 갱신되었습니다.', false);
        renderSeoulMap();
        renderWeatherTable();
        renderWeatherDetail();
        if (showAlert) alert('날씨와 미세먼지 데이터가 갱신되었습니다. 🌤️');
    } catch (error) {
        console.error(error);
        updateWeatherStatus('데이터를 불러오지 못했습니다. 네트워크 연결 또는 Open-Meteo API 상태를 확인해 주세요.', true);
    } finally {
        weatherIsLoading = false;
    }
}

function pickLatestAirQuality(hourly) {
    const times = hourly.time || [];
    if (times.length === 0) return { time: null, pm25: null, pm10: null, aqi: null };

    const now = new Date();
    let bestIndex = 0;
    let bestDiff = Infinity;
    times.forEach((time, index) => {
        const diff = Math.abs(now - new Date(time));
        if (diff < bestDiff) {
            bestDiff = diff;
            bestIndex = index;
        }
    });

    return {
        time: times[bestIndex],
        pm25: hourly.pm2_5?.[bestIndex],
        pm10: hourly.pm10?.[bestIndex],
        aqi: hourly.us_aqi?.[bestIndex]
    };
}

function renderWeatherTable() {
    const tbody = document.getElementById('weather-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (Object.keys(weatherCache).length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">아직 불러온 데이터가 없습니다.</td></tr>';
        return;
    }

    SEOUL_DISTRICTS.forEach(district => {
        const info = weatherCache[district.name] || {};
        const air = getAirQualityClass(Number(info.pm25));
        const tr = document.createElement('tr');
        tr.onclick = () => selectWeatherDistrict(district.name);
        tr.className = selectedWeatherDistrict === district.name ? 'active' : '';
        tr.style.cursor = 'pointer';
        tr.innerHTML = `
            <td><strong>${district.name}</strong></td>
            <td>${formatWeatherValue(info.temperature, '°C')}</td>
            <td>${info.weatherText || '-'}</td>
            <td>${formatWeatherValue(info.pm25, '㎍/㎥')}</td>
            <td>${formatWeatherValue(info.pm10, '㎍/㎥')}</td>
            <td>${formatWeatherValue(info.aqi, '')}</td>
            <td><span class="air-badge ${air.className}">${air.label}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderWeatherDetail() {
    const detail = document.getElementById('weather-detail');
    if (!detail) return;
    const info = weatherCache[selectedWeatherDistrict];
    if (!info) {
        detail.className = 'weather-detail-empty';
        detail.innerText = '선택한 지역의 데이터를 불러오는 중입니다.';
        return;
    }

    const air = getAirQualityClass(Number(info.pm25));
    detail.className = 'weather-detail-content';
    detail.innerHTML = `
        <div class="detail-district-name">${info.name}</div>
        <div class="detail-temp">${formatWeatherValue(info.temperature, '°C')}</div>
        <div class="detail-weather-text"><i class="fa-solid fa-cloud-sun"></i> ${info.weatherText || '-'}</div>
        <div class="detail-grid">
            <div><span>습도</span><strong>${formatWeatherValue(info.humidity, '%')}</strong></div>
            <div><span>풍속</span><strong>${formatWeatherValue(info.windSpeed, 'km/h')}</strong></div>
            <div><span>PM2.5</span><strong>${formatWeatherValue(info.pm25, '㎍/㎥')}</strong></div>
            <div><span>PM10</span><strong>${formatWeatherValue(info.pm10, '㎍/㎥')}</strong></div>
            <div><span>AQI</span><strong>${formatWeatherValue(info.aqi, '')}</strong></div>
            <div><span>대기 상태</span><strong class="air-text ${air.className}">${air.label}</strong></div>
        </div>
        <p class="weather-source-note">날씨 기준 시각: ${formatApiTime(info.weatherTime)} · 대기질 기준 시각: ${formatApiTime(info.airTime)}</p>
    `;
}

function updateWeatherStatus(message, isError) {
    const status = document.getElementById('weather-status');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('error', !!isError);
}

function formatWeatherValue(value, unit) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
    const rounded = Math.round(Number(value) * 10) / 10;
    return `${rounded}${unit}`;
}

function formatApiTime(value) {
    if (!value) return '-';
    return value.replace('T', ' ');
}

function getAirQualityClass(pm25) {
    if (Number.isNaN(pm25)) return { label: '확인중', className: 'air-unknown' };
    if (pm25 <= 15) return { label: '좋음', className: 'air-good' };
    if (pm25 <= 35) return { label: '보통', className: 'air-moderate' };
    if (pm25 <= 75) return { label: '나쁨', className: 'air-bad' };
    return { label: '매우 나쁨', className: 'air-very-bad' };
}

function getWeatherText(code) {
    const weatherMap = {
        0: '맑음', 1: '대체로 맑음', 2: '부분적으로 흐림', 3: '흐림',
        45: '안개', 48: '서리 안개', 51: '약한 이슬비', 53: '이슬비', 55: '강한 이슬비',
        56: '약한 어는 이슬비', 57: '강한 어는 이슬비', 61: '약한 비', 63: '비', 65: '강한 비',
        66: '약한 어는 비', 67: '강한 어는 비', 71: '약한 눈', 73: '눈', 75: '강한 눈',
        77: '싸락눈', 80: '약한 소나기', 81: '소나기', 82: '강한 소나기',
        85: '약한 눈 소나기', 86: '강한 눈 소나기', 95: '뇌우', 96: '우박 동반 뇌우', 99: '강한 우박 동반 뇌우'
    };
    return weatherMap[code] || '정보 없음';
}


// =========================================================
// 실시간 환율 계산기 모듈 (한국수출입은행 환율 API)
// =========================================================
const EXCHANGE_CURRENCIES = [
    { code: 'USD', label: 'USD 달러', unitLabel: '달러', divisor: 1 },
    { code: 'JPY(100)', label: 'JPY 엔화(100엔)', unitLabel: '엔', divisor: 100 },
    { code: 'CNH', label: 'CNY 위안화', unitLabel: '위안', divisor: 1 },
    { code: 'EUR', label: 'EUR 유로', unitLabel: '유로', divisor: 1 }
];

let exchangeRateCache = { a: null, b: null };
let exchangeAppInitialized = false;
let exchangeIsLoading = false;

function initExchangeApp() {
    if (!exchangeAppInitialized) {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const keyInput = document.getElementById('exchange-api-key');
        const savedKey = localStorage.getItem('korea_exim_exchange_api_key') || '';
        if (keyInput) keyInput.value = savedKey;

        const dateA = document.getElementById('exchange-date-a');
        const dateB = document.getElementById('exchange-date-b');
        if (dateA) dateA.value = formatDate(today);
        if (dateB) dateB.value = formatDate(yesterday);

        exchangeAppInitialized = true;
    }
    renderExchangeTable();
    calculateExchange();
}

function saveExchangeApiKey() {
    const keyInput = document.getElementById('exchange-api-key');
    const key = keyInput ? keyInput.value.trim() : '';
    if (!key) {
        alert('저장할 API KEY를 입력해 주세요.');
        return;
    }
    localStorage.setItem('korea_exim_exchange_api_key', key);
    updateExchangeStatus('API KEY가 이 브라우저에 저장되었습니다.', false);
    alert('API KEY가 저장되었습니다. 🔐');
}

function clearExchangeApiKey() {
    if (!confirm('저장된 API KEY를 삭제하시겠습니까?')) return;
    localStorage.removeItem('korea_exim_exchange_api_key');
    const keyInput = document.getElementById('exchange-api-key');
    if (keyInput) keyInput.value = '';
    updateExchangeStatus('저장된 API KEY가 삭제되었습니다.', false);
}

async function loadExchangeRates(showAlert) {
    if (exchangeIsLoading) return;

    const keyInput = document.getElementById('exchange-api-key');
    const apiKey = keyInput ? keyInput.value.trim() : '';
    const dateA = document.getElementById('exchange-date-a')?.value;
    const dateB = document.getElementById('exchange-date-b')?.value;

    if (!apiKey) {
        alert('한국수출입은행 Open API KEY를 입력해 주세요.');
        return;
    }
    if (!dateA || !dateB) {
        alert('비교할 날짜 A와 날짜 B를 모두 선택해 주세요.');
        return;
    }

    exchangeIsLoading = true;
    updateExchangeStatus('한국수출입은행 환율 데이터를 불러오는 중입니다...', false);

    try {
        const [ratesA, ratesB] = await Promise.all([
            fetchKoreaEximRates(apiKey, dateA),
            fetchKoreaEximRates(apiKey, dateB)
        ]);

        exchangeRateCache = {
            a: { date: dateA, rates: ratesA },
            b: { date: dateB, rates: ratesB }
        };

        const now = new Date();
        const updatedText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} 조회`;
        const updatedEl = document.getElementById('exchange-last-updated');
        if (updatedEl) updatedEl.innerText = updatedText;

        updateExchangeStatus('환율 데이터 조회가 완료되었습니다. 날짜별 비교표와 계산기를 확인해 주세요.', false);
        renderExchangeTable();
        calculateExchange();
        if (showAlert) alert('환율 데이터가 조회되었습니다. 💱');
    } catch (error) {
        console.error(error);
        updateExchangeStatus(error.message || '환율 데이터를 불러오지 못했습니다. API KEY, 날짜, 네트워크 상태를 확인해 주세요.', true);
    } finally {
        exchangeIsLoading = false;
    }
}

async function fetchKoreaEximRates(apiKey, dateValue) {
    const yyyymmdd = dateValue.replaceAll('-', '');
    const url = `https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey=${encodeURIComponent(apiKey)}&searchdate=${yyyymmdd}&data=AP01`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${dateValue} 환율 API 응답이 올바르지 않습니다.`);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error(`${dateValue} 환율 응답 형식이 예상과 다릅니다.`);
    if (data.length === 0) throw new Error(`${dateValue}에는 환율 데이터가 없습니다. 영업일 또는 고시일을 선택해 주세요.`);
    if (data[0]?.result && data[0].result !== 1) throw new Error(getExchangeApiErrorMessage(data[0].result));

    const result = {};
    EXCHANGE_CURRENCIES.forEach(currency => {
        const found = data.find(item => item.cur_unit === currency.code);
        if (found) {
            result[currency.code] = {
                ...currency,
                rate: parseExchangeRate(found.deal_bas_r),
                rawRate: found.deal_bas_r,
                name: found.cur_nm,
                ttBuying: found.ttb,
                ttSelling: found.tts
            };
        }
    });
    return result;
}

function parseExchangeRate(value) {
    if (value === undefined || value === null) return null;
    const parsed = Number(String(value).replaceAll(',', ''));
    return Number.isFinite(parsed) ? parsed : null;
}

function getExchangeApiErrorMessage(resultCode) {
    const messages = {
        1: '정상 응답입니다.',
        2: 'DATA 코드 오류입니다.',
        3: '인증코드 오류입니다. API KEY를 확인해 주세요.',
        4: '일일 제한 횟수를 초과했습니다.'
    };
    return messages[resultCode] || '한국수출입은행 환율 API 오류가 발생했습니다.';
}

function renderExchangeTable() {
    const tbody = document.getElementById('exchange-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!exchangeRateCache.a || !exchangeRateCache.b) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">아직 조회된 환율 데이터가 없습니다.</td></tr>';
        return;
    }

    EXCHANGE_CURRENCIES.forEach(currency => {
        const rateA = exchangeRateCache.a.rates[currency.code]?.rate;
        const rateB = exchangeRateCache.b.rates[currency.code]?.rate;
        const diff = Number.isFinite(rateA) && Number.isFinite(rateB) ? rateA - rateB : null;
        const changeRate = diff !== null && rateB !== 0 ? (diff / rateB) * 100 : null;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${currency.label}</strong></td>
            <td>${formatRateForDisplay(rateA)}원</td>
            <td>${formatRateForDisplay(rateB)}원</td>
            <td class="${getDiffClass(diff)}">${formatDiff(diff)}원</td>
            <td class="${getDiffClass(diff)}">${formatPercent(changeRate)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function calculateExchange() {
    const resultBox = document.getElementById('exchange-result');
    if (!resultBox) return;

    const cacheKey = document.getElementById('exchange-calc-date')?.value || 'a';
    const currencyCode = document.getElementById('exchange-currency')?.value || 'USD';
    const amount = Number(document.getElementById('exchange-amount')?.value || 0);
    const direction = document.getElementById('exchange-direction')?.value || 'krwToForeign';
    const rateInfo = exchangeRateCache[cacheKey]?.rates?.[currencyCode];
    const selectedDate = exchangeRateCache[cacheKey]?.date;

    if (!rateInfo || !Number.isFinite(rateInfo.rate)) {
        resultBox.innerHTML = '환율 조회 후 계산 결과가 표시됩니다.';
        return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
        resultBox.innerHTML = '계산할 금액을 0 이상으로 입력해 주세요.';
        return;
    }

    let result;
    let description;
    if (direction === 'krwToForeign') {
        result = currencyCode === 'JPY(100)' ? (amount / rateInfo.rate) * 100 : amount / rateInfo.rate;
        description = `${formatKrw(amount)} → ${formatForeign(result, rateInfo.unitLabel)}`;
    } else {
        result = currencyCode === 'JPY(100)' ? (amount / 100) * rateInfo.rate : amount * rateInfo.rate;
        description = `${formatForeign(amount, rateInfo.unitLabel)} → ${formatKrw(result)}`;
    }

    resultBox.innerHTML = `
        <strong>${description}</strong>
        <span>${selectedDate} 기준 ${rateInfo.label} 매매기준율: ${formatRateForDisplay(rateInfo.rate)}원${currencyCode === 'JPY(100)' ? ' / 100엔' : ''}</span>
    `;
}

function updateExchangeStatus(message, isError) {
    const status = document.getElementById('exchange-status');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('error', !!isError);
}

function formatRateForDisplay(value) {
    if (!Number.isFinite(value)) return '-';
    return value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDiff(value) {
    if (!Number.isFinite(value)) return '-';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value) {
    if (!Number.isFinite(value)) return '-';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
}

function getDiffClass(value) {
    if (!Number.isFinite(value) || value === 0) return 'rate-flat';
    return value > 0 ? 'rate-up' : 'rate-down';
}

function formatKrw(value) {
    return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

function formatForeign(value, unitLabel) {
    return `${Number(value).toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unitLabel}`;
}
