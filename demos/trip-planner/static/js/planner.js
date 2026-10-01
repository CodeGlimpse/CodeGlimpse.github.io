(function () {
    'use strict';
    const root = document.querySelector('[data-trip-planner]');
    if (!root) return;
    const status = root.querySelector('#planner-status');

    function money(cents) {
        return `¥${Math.trunc(cents / 100).toLocaleString('zh-CN')}.${String(cents % 100).padStart(2, '0')}`;
    }

    try {
        const core = window.TripPlannerCore;
        if (!core) throw new Error('Missing planner core');
        const places = core.validatePlaces(JSON.parse(root.querySelector('#planner-data').textContent));
        const byId = new Map(places.map(place => [place.id, place]));
        const filter = root.querySelector('#place-category');
        const list = root.querySelector('#itinerary-list');
        const route = root.querySelector('#itinerary-route');
        const warning = root.querySelector('#day-warning');
        const empty = root.querySelector('#itinerary-empty');
        const clear = root.querySelector('[data-action="clear"]');
        const cards = [...root.querySelectorAll('[data-place-card]')];
        const markers = [...root.querySelectorAll('[data-map-id]')];
        const isJournal = document.body.dataset.template === 'journal';
        if (cards.length !== places.length || markers.length !== places.length
            || [...cards, ...markers].some(element => !byId.has(element.dataset.placeId || element.dataset.mapId))) {
            throw new Error('Place markup does not match data');
        }
        let itinerary = [];

        function refreshPlaces() {
            const visible = new Set(core.filterPlaces(places, filter.value).map(place => place.id));
            root.querySelector('[data-visible-count]').textContent = `${visible.size} 处`;
            for (const card of cards) {
                const place = byId.get(card.dataset.placeId);
                const button = card.querySelector('[data-action="add"]');
                const selected = itinerary.includes(place.id);
                const full = itinerary.length === core.MAX_STOPS;
                card.hidden = !visible.has(place.id);
                button.disabled = selected || full;
                button.textContent = selected ? '已加入行程' : full ? '行程已满' : '＋ 加入行程';
                button.setAttribute('aria-label', selected ? `${place.name}已加入行程` : full ? `行程已满，无法加入${place.name}` : `加入${place.name}`);
            }
            for (const marker of markers) {
                marker.classList.toggle('is-muted', !visible.has(marker.dataset.mapId) && !itinerary.includes(marker.dataset.mapId));
            }
        }

        function actionButton(text, label, action, id, disabled = false) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = text;
            button.setAttribute('aria-label', label);
            button.dataset.action = action;
            button.dataset.id = id;
            button.disabled = disabled;
            return button;
        }

        function render() {
            const totals = core.summarize(places, itinerary);
            for (const [key, value] of Object.entries(totals)) {
                const target = root.querySelector(`[data-total="${key}"]`);
                if (target) target.textContent = key === 'costCents' ? money(value) : String(value);
            }
            root.querySelector('[data-selection-count]').textContent = `${totals.count} / ${core.MAX_STOPS}`;
            empty.hidden = totals.count !== 0;
            clear.disabled = totals.count === 0;
            warning.hidden = !totals.overDay;
            warning.textContent = totals.overDay ? `这条行程约需 ${totals.totalMinutes} 分钟，已超过 8 小时。可以减少地点或拆成两天。` : '';

            const fragment = document.createDocumentFragment();
            let elapsedMinutes = 0;
            itinerary.forEach((id, index) => {
                const place = byId.get(id);
                const item = document.createElement('li');
                item.className = 'itinerary-stop';
                item.dataset.stopId = id;
                const number = document.createElement('span');
                number.className = 'stop-number';
                number.textContent = String(index + 1);
                number.setAttribute('aria-hidden', 'true');
                const content = document.createElement('div');
                if (isJournal) {
                    const arrivalMinutes = elapsedMinutes + (index === 0 ? 0 : core.TRANSFER_MINUTES);
                    elapsedMinutes = arrivalMinutes + place.durationMinutes;
                    const timing = document.createElement('p');
                    timing.className = 'stop-time';
                    timing.textContent = `累计 ${arrivalMinutes} — ${elapsedMinutes} 分钟`;
                    content.append(timing);
                }
                const title = document.createElement('h3');
                title.textContent = `${index + 1}. ${place.name}`;
                title.tabIndex = -1;
                title.dataset.stopTitle = '';
                const meta = document.createElement('p');
                meta.className = 'stop-meta';
                meta.textContent = `${place.category} · ${place.durationMinutes} 分钟 · ${money(place.costCents)}`;
                const actions = document.createElement('div');
                actions.className = 'stop-actions';
                actions.append(
                    actionButton('↑ 上移', `上移${place.name}`, 'move-up', id, index === 0),
                    actionButton('↓ 下移', `下移${place.name}`, 'move-down', id, index === itinerary.length - 1),
                    actionButton('移除', `移除${place.name}`, 'remove', id),
                );
                content.append(title, meta, actions);
                item.append(number, content);
                fragment.append(item);
            });
            list.replaceChildren(fragment);

            const points = core.routePoints(places, itinerary);
            route.setAttribute('points', points.length > 1 ? points.map(point => `${Number((point.x * 8).toFixed(2))},${Number((point.y * 5.6).toFixed(2))}`).join(' ') : '');
            route.toggleAttribute('hidden', points.length < 2);
            for (const marker of markers) {
                const order = itinerary.indexOf(marker.dataset.mapId) + 1;
                marker.classList.toggle('is-selected', order > 0);
                marker.querySelector('[data-route-disc]').toggleAttribute('hidden', order === 0);
                const number = marker.querySelector('[data-route-number]');
                number.toggleAttribute('hidden', order === 0);
                number.textContent = order ? String(order) : '';
            }
            root.querySelector('#map-description').textContent = itinerary.length
                ? `原创地形示意，非真实地理导航。当前顺序：${itinerary.map(id => byId.get(id).name).join('，')}。橙线只表示清单顺序。`
                : '八个虚构地点的示意位置，当前行程为空。非真实地理导航。';
            refreshPlaces();
        }

        function focusStop(id, action = 'remove') {
            const item = [...list.children].find(element => element.dataset.stopId === id);
            if (!item) return;
            const button = item.querySelector(`[data-action="${action}"]`);
            if (button && !button.disabled) button.focus();
            else item.querySelector('[data-stop-title]').focus();
        }

        root.addEventListener('click', event => {
            const button = event.target.closest('button[data-action]');
            if (!button || !root.contains(button) || button.disabled) return;
            const { action, id } = button.dataset;
            if (action === 'clear') {
                itinerary = [];
                render();
                status.textContent = '已清空行程。';
                filter.focus();
                return;
            }
            if (!['add', 'remove', 'move-up', 'move-down'].includes(action)) return;
            const place = byId.get(id);
            if (!place) { status.textContent = '未找到这个地点。'; return; }
            const previousIndex = itinerary.indexOf(id);
            const result = action === 'add' ? core.addPlace(places, itinerary, id)
                : action === 'remove' ? core.removePlace(places, itinerary, id)
                    : core.movePlace(places, itinerary, id, action === 'move-up' ? -1 : 1);
            if (!result.changed) {
                status.textContent = result.reason === 'full' ? '最多可加入 6 处地点。'
                    : result.reason === 'duplicate' ? '这个地点已在行程中。' : '行程顺序未改变。';
                return;
            }
            itinerary = result.ids;
            render();
            if (action === 'add') {
                status.textContent = `${place.name}已加入第 ${itinerary.length} 站。${itinerary.length === core.MAX_STOPS ? '行程已满，共 6 处。' : ''}`;
                focusStop(id);
            } else if (action === 'remove') {
                status.textContent = `已移除${place.name}。`;
                if (itinerary.length) focusStop(itinerary[Math.min(previousIndex, itinerary.length - 1)]);
                else filter.focus();
            } else {
                status.textContent = `${place.name}已移到第 ${itinerary.indexOf(id) + 1} 站。`;
                focusStop(id, action);
            }
        });
        filter.addEventListener('change', () => {
            refreshPlaces();
            status.textContent = `显示${filter.value === 'all' ? '全部' : filter.value}地点；已选行程保留。`;
        });
        render();
        filter.disabled = false;
        root.dataset.ready = 'true';
    } catch (error) {
        root.querySelectorAll('button, select').forEach(control => { control.disabled = true; });
        root.dataset.ready = 'error';
        if (status) status.textContent = '暂时无法启用行程编排，可以继续只读浏览地点与地图。';
    }
})();
