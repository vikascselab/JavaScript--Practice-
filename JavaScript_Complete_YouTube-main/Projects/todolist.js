 (function(){
      const el = {
        form: document.getElementById('form'),
        input: document.getElementById('input'),
        list: document.getElementById('list'),
        count: document.getElementById('count'),
        empty: document.getElementById('empty'),
        filterTabs: document.querySelectorAll('.seg [role="tab"]'),
        clearDone: document.getElementById('clearDone'),
        saveHint: document.getElementById('saveHint')
      };

      const STORAGE_KEY = 'todo-v1';
      /** @type {{id:string,text:string,done:boolean,created:number}[]} */
      let todos = load();
      let filter = 'all';

      function uid(){ return Math.random().toString(36).slice(2,9); }

      function load(){
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : [];
        } catch { return []; }
      }
      function save(){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        el.saveHint.textContent = 'Autosaved';
        clearTimeout(save._t);
        save._t = setTimeout(()=> el.saveHint.textContent = ' ', 1200);
      }

      function setFilter(next){
        filter = next;
        el.filterTabs.forEach(btn=> btn.classList.toggle('active', btn.dataset.filter===filter));
        render();
      }

      function add(text){
        text = text.trim();
        if(!text) return;
        todos.unshift({ id: uid(), text, done: false, created: Date.now() });
        save();
        render();
      }

      function toggle(id){
        const t = todos.find(x=> x.id===id);
        if(t){ t.done = !t.done; save(); render(); }
      }

      function remove(id){
        todos = todos.filter(x=> x.id!==id);
        save();
        render();
      }

      function edit(id){
        const li = el.list.querySelector(`[data-id="${id}"]`);
        const textSpan = li.querySelector('span');
        const old = textSpan.textContent;
        const input = document.createElement('input');
        input.className = 'edit-input';
        input.value = old;
        input.setAttribute('aria-label','Edit task');
        li.classList.add('editing');
        textSpan.replaceWith(input);
        input.focus();
        input.setSelectionRange(old.length, old.length);

        const finish = (ok)=>{
          if(ok){
            const t = todos.find(x=> x.id===id);
            if(t){ t.text = input.value.trim() || old; save(); }
          }
          input.replaceWith(textSpan);
          textSpan.textContent = todos.find(x=> x.id===id)?.text || old;
          li.classList.remove('editing');
        };
        input.addEventListener('keydown', e=>{
          if(e.key==='Enter') finish(true);
          else if(e.key==='Escape') finish(false);
        });
        input.addEventListener('blur', ()=> finish(true));
      }

      function clearCompleted(){
        if(todos.some(t=>t.done)){
          todos = todos.filter(t=> !t.done);
          save();
          render();
        }
      }

      function filtered(){
        if(filter==='active') return todos.filter(t=> !t.done);
        if(filter==='done') return todos.filter(t=> t.done);
        return todos;
      }

      function render(){
        const items = filtered();
        el.list.innerHTML = '';
        el.empty.hidden = items.length !== 0;
        items.forEach(t=>{
          const li = document.createElement('li');
          li.className = 'todo' + (t.done ? ' done' : '');
          li.dataset.id = t.id;
          li.innerHTML = `
            <input class="chk" type="checkbox" ${t.done?'checked':''} aria-label="Toggle ${t.text}">
            <div class="txt"><span>${escapeHtml(t.text)}</span></div>
            <div class="actions">
              <button class="icon-btn" data-act="edit" title="Edit">✏️</button>
              <button class="icon-btn" data-act="del" title="Delete">🗑️</button>
            </div>`;

          li.querySelector('.chk').addEventListener('change', ()=> toggle(t.id));
          li.querySelector('[data-act="del"]').addEventListener('click', ()=> remove(t.id));
          li.querySelector('[data-act="edit"]').addEventListener('click', ()=> edit(t.id));
          li.querySelector('.txt').addEventListener('dblclick', ()=> edit(t.id));
          el.list.appendChild(li);
        });

        const remaining = todos.filter(t=>!t.done).length;
        el.count.textContent = `${remaining} item${remaining!==1?'s':''} left`;
      }

      function escapeHtml(s){
        return s.replace(/[&<>"]+/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
      }

      // Wire up UI
      el.form.addEventListener('submit', e=>{
        e.preventDefault();
        add(el.input.value);
        el.input.value='';
        el.input.focus();
      });
      el.filterTabs.forEach(btn=> btn.addEventListener('click', ()=> setFilter(btn.dataset.filter)));
      el.clearDone.addEventListener('click', clearCompleted);

      // Keyboard add: Ctrl/Cmd+Enter
      document.addEventListener('keydown', (e)=>{
        if((e.ctrlKey||e.metaKey) && e.key==='Enter') add(el.input.value);
      });

      render();
    })();