/**
 * @fileOverview Owl dialog windows
 * @author Kolobov Alexander
 * @copyright AgileFusion
 */

window.owl = (window.owl || (function(_) {
	"use strict";

	// Static
	
	var current = null,
		ready = false,
		delay_animation = 300,
		delay_next = 100,
		classname_hidden = 'owl-hidden',
		classname_before = 'owl-before',
		classname_after = 'owl-after',
		classname_withclose = 'owl-withclose',
		type = {
			loader: {
				classname: 'owl-loader',
				maxwidth: '626px',
				minwidth: '280px',
				timeout: 0,
				close: false,
				accept: false,
				decline: false,
				title: false,
				content: 'Пожалуйста, подождите...'
			},
			ok: {
				classname: 'owl-ok',
				maxwidth: '626px',
				minwidth: '280px',
				timeout: 2000,
				close: true,
				accept: false,
				decline: false,
				title: 'Ок',
				content: 'Операция успешно завершена!'
			},
			confirm: {
				classname: 'owl-confirm',
				maxwidth: '626px',
				minwidth: '280px',
				timeout: 0,
				close: false,
				accept: 'Ок',
				decline: 'Отмена',
				title: 'Подтверждение',
				content: 'Вы подтверждаете выполнение операции?'
			},
			error: {
				classname: 'owl-error',
				maxwidth: '626px',
				minwidth: '280px',
				timeout: 10000,
				close: true,
				accept: false,
				decline: false,
				title: 'Ошибка!',
				content: 'Произошла непредвиденная ошибка.'
			},
			general: {
				classname: 'owl-general',
				maxwidth: '626px',
				minwidth: '280px',
				timeout: 0,
				close: true,
				accept: false,
				decline: false,
				title: 'Сообщение',
				content: ''
			}
		},
		timeout = null,
		ui = {
			outer: utils.node('div', {attr:{'class':'owl-outer'}}),
			table: utils.node('div', {attr:{'class':'owl-table'}}),
			cell: utils.node('div', {attr:{'class':'owl-cell'}}),
			inner: utils.node('div', {attr:{'class':'owl-inner'}}),
			title: utils.node('div', {attr:{'class':'owl-title'}}),
			close: utils.node('div', {attr:{'class':'owl-close'}}),
			content: utils.node('div', {attr:{'class':'owl-content'}}),
			panel: utils.node('div', {attr:{'class':'owl-panel'}}),
			accept: utils.node('div', {attr:{'class':'owl-accept button button-green button-max m-right-min button'}}),
			decline: utils.node('div', {attr:{'class':'owl-decline button button-white button-max button'}})
		},
		handler = function(param, event) {
			if(this.overlay && ((event ? event.target : window.event.srcElement) != ui.cell)) return;
			event.preventDefault(); 
			current && current.close(param);
		},
		reset = function() {
			close();
			current && utils.classes.remove(ui.outer, current.type.classname);
			timeout && clearTimeout(timeout);
			current = null;
			queue && queue.clean();
			queue = new utils.queue();
			queue.callback(reset);
		},
		close = function() {
			utils.classes.add(ui.outer, classname_hidden+' '+classname_after);
			document.body.style.overflow = '';
			document.body.style.paddingRight = '';
		},
		open = function() {
			utils.classes.remove(ui.outer, classname_hidden+' '+classname_before);
			var width = document.body.offsetWidth;
			document.body.style.overflow = 'hidden';
			document.body.style.paddingRight = Math.abs(width-document.body.offsetWidth) + 'px';
			setTimeout(utils.classes.remove.bind(utils.classes, ui.outer, classname_after),1);
		},
		queue = new utils.queue().callback(reset);

	utils.ready(function() {
		ui.close.addEventListener('click', handler.bind({},void(0)));
		ui.close.addEventListener('touchstart', handler.bind({},void(0)));
		ui.accept.addEventListener('click', handler.bind({},true));
		ui.accept.addEventListener('touchstart', handler.bind({},true));
		ui.decline.addEventListener('click', handler.bind({},false));
		ui.decline.addEventListener('touchstart', handler.bind({},false));
		ui.cell.addEventListener('click', handler.bind({overlay:true},false));
		ui.cell.addEventListener('touchstart', handler.bind({overlay:true},false));
		ui.outer.appendChild(ui.table).appendChild(ui.cell).appendChild(ui.inner).appendChild(ui.title);
		ui.inner.appendChild(ui.close);
		ui.inner.appendChild(ui.content);
		ui.inner.appendChild(ui.panel).appendChild(ui.accept);
		ui.panel.appendChild(ui.decline);
		document.body.appendChild(ui.outer);
		ready = true;
		queue.execute();
	});
	
	var _ = function(params) {
		
		this.data = utils.extend({}, params);
		this.params = params || {};
		this.type = type[this.params.type||''] || type.general;
		queue.async(this.open.bind(this));
		ready && queue.execute();
		return _;

	}
	_.prototype = {

		content_node: null,
		content_parent: null,

		update: function(name) {
			ui[name].innerHTML = this[this.params[name]==void(0)?'type':'params'][name];
			utils.classes[this[this.params[name]==void(0)?'type':'params'][name] ? 'remove' : 'add'](ui[name], classname_hidden);
		},

		reopen: function() {
			console.log(this.data);
			new owl(this.data);
		},

		open: function() {
			window.tip && window.tip.close();
			this.update('title');
			this.update('accept');
			this.update('decline');

			if(this.params.content!=void(0)){
				if(this.params.content.substr(0,1)=='#') {
					this.params.content = document.getElementById(this.params.content.substr(1));
				}
				if(this.params.content instanceof HTMLElement) {
					this.content_node = this.params.content;
					this.content_parent = this.params.content.parentNode;
					ui.content.innerHTML = '';
					ui.content.appendChild(this.params.content);
					utils.classes.remove(ui.content, classname_hidden);
				} else {
					this.params.content = this.params.content+'';
					this.update('content');
				}
			} else {
				this.update('content');
			}

			ui.content.style.minWidth = this[this.params.minwidth==void(0)?'type':'params'].minwidth;
			ui.content.style.maxWidth = this[this.params.maxwidth==void(0)?'type':'params'].maxwidth;

			utils.classes[utils.classes.has(ui.accept, classname_hidden) && utils.classes.has(ui.decline, classname_hidden) ? 'add' : 'remove'](ui.panel, classname_hidden);
			utils.classes[this[this.params.close==void(0)?'type':'params'].close ? 'remove' : 'add'](ui.close, classname_hidden);
			utils.classes[this[this.params.close==void(0)?'type':'params'].close ? 'add' : 'remove'](ui.title, classname_withclose);
			utils.classes.replace(ui.outer, (current ? current.type.classname : ''), this.type.classname);
			if(this[this.params.timeout==void(0)?'type':'params'].timeout) timeout = setTimeout(this.close.bind(this), this[this.params.timeout==void(0)?'type':'params'].timeout);
			current ? !current.params.noanimation && utils.classes.remove(ui.outer, classname_after) : open();
			current = this;
			ui.outer.scrollTop = 0;
		},

		close: function(param) {
			window.tip && window.tip.close();
			timeout && clearTimeout(timeout);
			if(current ? !current.params.noanimation : !0) utils.classes.add(ui.outer, classname_before);
			setTimeout(function() {	
				if(current ? !current.params.noanimation : !0) utils.classes.replace(ui.outer, classname_before, classname_after);
				this.params.callback && this.params.callback(param);
				setTimeout(function(){
					if(this.content_node && this.content_parent) {
						this.content_parent.appendChild(this.content_node);
					}
					queue.proceed();
				}.bind(this),delay_next);
			}.bind(this),delay_animation)
		}
		
	};
	_.current = function() {return current};
	_.reset = reset;
	_.close = function() {current && current.close(false);};
	return _;
})());