// =========================================================
// 📝 수업 필기노트 시스템 모듈 (note.js)
// =========================================================

// 상태 제어 관리 변수
let noteSubjects = JSON.parse(localStorage.getItem('note_subjects_data')) || ['기초 국어', '비즈니스 영어', 'AI 트랜스포메이션'];
let notesStore = JSON.parse(localStorage.getItem('notes_store_data')) || [];
let activeSubject = '전체';
let activeNoteId = null;

// 노트 서비스 초기화 인터페이스
function initNoteApp() {
    renderSubjects();
    renderNoteTitles();
    updateEditorView();
}

// 과목 카테고리 렌더러
function renderSubjects() {
    const listContainer = document.getElementById('subject-list');
    if(!listContainer) return;
    listContainer.innerHTML = '';

    // '전체보기' 기본 추가
    const allLi = document.createElement('li');
    allLi.className = `subject-item ${activeSubject === '전체' ? 'active' : ''}`;
    allLi.innerHTML = `<span><i class="fa-solid fa-folder-open"></i> 전체보기</span>`;
    allLi.onclick = () => {
        activeSubject = '전체';
        renderSubjects();
        renderNoteTitles();
    };
    listContainer.appendChild(allLi);

    // 저장된 개별 과목 매핑
    noteSubjects.forEach(sub => {
        const li = document.createElement('li');
        li.className = `subject-item ${activeSubject === sub ? 'active' : ''}`;
        li.innerHTML = `
            <span><i class="fa-regular fa-folder"></i> ${sub}</span>
            <button class="note-item-del-btn" onclick="deleteSubject('${sub}', event)"><i class="fa-regular fa-circle-xmark"></i></button>
        `;
        li.onclick = () => {
            activeSubject = sub;
            renderSubjects();
            renderNoteTitles();
        };
        listContainer.appendChild(li);
    });
}

// 과목 카테고리 등록 엔진
function addSubject() {
    const input = document.getElementById('subject-input');
    const subName = input.value.trim();
    if (!subName) return;

    if (noteSubjects.includes(subName) || subName === '전체') {
        alert('이미 존재하는 과목 카테고리 이름입니다.');
        return;
    }

    noteSubjects.push(subName);
    localStorage.setItem('note_subjects_data', JSON.stringify(noteSubjects));
    input.value = '';
    renderSubjects();
}

// 과목 카테고리 삭제 제거 엔진
function deleteSubject(subName, event) {
    event.stopPropagation();
    if(!confirm(`'${subName}' 과목 카테고리를 삭제하시겠습니까?\n해당 과목으로 지정된 노트들의 카테고리는 '지정 없음'으로 초기화됩니다.`)) return;

    noteSubjects = noteSubjects.filter(s => s !== subName);
    localStorage.setItem('note_subjects_data', JSON.stringify(noteSubjects));
    
    // 연관 노트 과목 메타데이터 초기화
    notesStore = notesStore.map(note => {
        if (note.subject === subName) note.subject = '지정 없음';
        return note;
    });
    localStorage.setItem('notes_store_data', JSON.stringify(notesStore));

    if (activeSubject === subName) activeSubject = '전체';
    renderSubjects();
    renderNoteTitles();
    updateEditorView();
}

// 우측 에디터 뷰 텍스트 영역 렌더링 동적 스위처
function updateEditorView() {
    const editorView = document.getElementById('note-editor-view');
    const emptyView = document.getElementById('note-empty-view');
    
    if (!activeNoteId) {
        if(editorView) editorView.style.display = 'none';
        if(emptyView) emptyView.style.display = 'block';
        return;
    }

    if(editorView) editorView.style.display = 'flex';
    if(emptyView) emptyView.style.display = 'none';

    const activeNote = notesStore.find(n => n.id === activeNoteId);
    if (activeNote) {
        document.getElementById('note-title').value = activeNote.title;
        document.getElementById('note-content').value = activeNote.content;
        document.getElementById('note-meta-subject').innerHTML = `<i class="fa-regular fa-bookmark"></i> 과목: <strong>${activeNote.subject}</strong>`;
        document.getElementById('note-meta-date').innerHTML = `<i class="fa-regular fa-clock"></i> 수정일: ${activeNote.updatedAt}`;
    }
}

// 개별 리스트 타이틀 컴포넌트 드라이버
function renderNoteTitles() {
    const container = document.getElementById('note-titles-list');
    if(!container) return;
    container.innerHTML = '';

    // 현재 선택된 과목 필터링 적용된 목록 추출
    const filteredNotes = notesStore.filter(n => {
        if (activeSubject === '전체') return true;
        return n.subject === activeSubject;
    });

    if (filteredNotes.length === 0) {
        container.innerHTML = `<li style="text-align:center; color:var(--text-light); font-size:12px; padding:15px 0; font-style:italic;">작성된 노트 없음</li>`;
        return;
    }

    // 수정일 타임스탬프 기준 내림차순 정렬
    filteredNotes.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    filteredNotes.forEach(note => {
        const li = document.createElement('li');
        li.className = `note-title-item ${activeNoteId === note.id ? 'active' : ''}`;
        li.innerHTML = `
            <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">
                <i class="fa-regular fa-file-lines"></i> ${note.title || '제목 없는 노트'}
            </div>
            <button class="note-item-del-btn" onclick="deleteNote('${note.id}', event)"><i class="fa-regular fa-trash-can"></i></button>
        `;
        li.onclick = () => {
            activeNoteId = note.id;
            renderNoteTitles();
            updateEditorView();
        };
        container.appendChild(li);
    });
}

// 새로운 노트 원시 모델 팩토리 컴포넌트
function createNewNote() {
    const newId = 'note_' + Date.now();
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    const newNote = {
        id: newId,
        title: '',
        content: '',
        subject: activeSubject === '전체' ? '지정 없음' : activeSubject,
        updatedAt: formattedDate
    };

    notesStore.unshift(newNote);
    localStorage.setItem('notes_store_data', JSON.stringify(notesStore));
    
    activeNoteId = newId;
    renderNoteTitles();
    updateEditorView();
    document.getElementById('note-title').focus();
}

// 활성화된 에디터 노출 노트 임시 저장 커밋 파서
function saveActiveNote() {
    if (!activeNoteId) return;

    const titleVal = document.getElementById('note-title').value.trim();
    const contentVal = document.getElementById('note-content').value;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    notesStore = notesStore.map(note => {
        if (note.id === activeNoteId) {
            note.title = titleVal || '제목 없는 노트';
            note.content = contentVal;
            note.updatedAt = formattedDate;
        }
        return note;
    });

    localStorage.setItem('notes_store_data', JSON.stringify(notesStore));
    renderNoteTitles();
    updateEditorView();
    alert('노트 필기가 안전하게 보관되었습니다! 💾🌸');
}

// 노트 영구 제거 삭제 모듈
function deleteNote(id, event) {
    event.stopPropagation();
    if (!confirm('해당 수업 필기 노트를 영구 삭제하시겠습니까?')) return;

    notesStore = notesStore.filter(n => n.id !== id);
    localStorage.setItem('notes_store_data', JSON.stringify(notesStore));

    if (activeNoteId === id) {
        activeNoteId = null;
    }

    renderNoteTitles();
    updateEditorView();
}
