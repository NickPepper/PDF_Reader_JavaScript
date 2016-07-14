/**
 * @fileOverview Main js
 * @author Alexander Kolobov, Nick Pershin
 * @copyright AgileFusion
 */


var Reader = new Pish(['utils','PDFJS','window','document','undefined'], function(utils, pdf, window, doc, undefined) {
	'use strict';

	// Private

	var page = null,
		pages = [],
		book = null,
		BACKEND_URL = 'http://work.da.am/dumb_backend/';

	// UI elements
	
	var nodePageNext = null,
		nodePagePrev = null,
		nodePageCurrent = null,
		nodePageTotal = null,
		nodeBookmarkToggle = null,
		nodeBookmarkSelect = null,
		nodeZoomPlus = null,
		nodeZoomMinus = null,
		nodeZoomFullscreen = null,
		nodeZoomSelect = null,
		nodeContent = null;

	// Fullscreen

	var isFullscreenSupported = doc.fullscreenEnabled || doc.webkitFullscreenEnabled ||
			doc.mozFullScreenEnabled || doc.msFullscreenEnabled,
		isFullscreened = false,
		fullscreenEnter = null,
		fullscreenExit = null,
		fullscreenEvent = null;

	switch(true) {
		case !!doc.fullscreenEnabled:
			fullscreenEnter = function() { doc.body.requestFullscreen(); return true; };
			fullscreenExit = function() { doc.exitFullscreen(); return false; };
			fullscreenEvent = 'fullscreenchange';
		break;
		case !!doc.webkitFullscreenEnabled:
			fullscreenEnter = function() { doc.body.webkitRequestFullscreen(); return true; };
			fullscreenExit = function() { doc.webkitExitFullscreen(); return false; };
			fullscreenEvent = 'webkitfullscreenchange';
		break;
		case !!doc.mozFullScreenEnabled:
			fullscreenEnter = function() { doc.body.mozRequestFullScreen(); return true; };
			fullscreenExit = function() { doc.mozCancelFullScreen(); return false; };
			fullscreenEvent = 'mozfullscreenchange';
		break;
		case !!doc.msFullscreenEnabled:
			fullscreenEnter = function() { doc.body.msRequestFullscreen(); return true; };
			fullscreenExit = function() { doc.msExitFullscreen(); return false; };
			fullscreenEvent = 'msfullscreenchange';
		break;
	}

	// Public
	
	return [function Reader() { // Object constructor

		// UI
		 
		nodePageNext = utils.classes.find('page-next')[0];
		nodePagePrev = utils.classes.find('page-prev')[0];
		nodePageCurrent = utils.classes.find('page-current')[0];
		nodePageTotal = utils.classes.find('page-total')[0];
		nodeBookmarkToggle = utils.classes.find('bookmark-toggle')[0];
		nodeBookmarkSelect = doc.getElementById('bookmark-select');
		nodeZoomPlus = utils.classes.find('zoom-plus')[0];
		nodeZoomMinus = utils.classes.find('zoom-minus')[0];
		nodeZoomFullscreen = utils.classes.find('zoom-fullscreen')[0];
		nodeZoomSelect = doc.getElementById('zoom-select');
		nodeContent = utils.classes.find('content')[0];

		// Events

		utils.events(nodeZoomFullscreen, 'click', this.fullscreenToggle.bind(this));
		utils.events(nodeBookmarkToggle, 'click', this.bookmarkToggle.bind(this));
		utils.events(nodePageNext, 'click', this.pageNext.bind(this));
		utils.events(nodePagePrev, 'click', this.pagePrev.bind(this));
		isFullscreenSupported && utils.events(doc, fullscreenEvent, function() {
			isFullscreened = !isFullscreened;
			utils.classes[isFullscreened ? 'add' : 'remove'](nodeZoomFullscreen, 'selected');
		});

		// Reset

		this.bookClose();

	}, { // Object prototype

		pageOpen: function(index) {
			console.log('pageOpen: index = '+index);
			if(page) {
				if(page.node.canvas) page.node.canvas.style.visibility = 'hidden';
				nodeContent.innerHTML = '';
			}
			page = pages[index];
			nodePageCurrent.value = page.number;
			utils.classes[page.state.bookmarked ? 'add' : 'remove'](nodeBookmarkToggle, 'selected');
			this.render();
		},

		render: function() {
			// Create canvas if needded and append it
			if(!page.node.canvas) {
				page.node.canvas = utils.node('canvas', {
					attr: {id: 'page'+page.index},
					css: {visibility: 'hidden'}
				});
			}
			nodeContent.appendChild(page.node.canvas);

			// fetch PDF document from URL using promises
			PDFJS.getDocument(BACKEND_URL + book.metadata.identifier + "/" + page.url).then(function(pdf) {
				// using promise to fetch the page
				pdf.getPage(1).then(function(pdfpage) {
					var scale = 1.5,
						viewport = pdfpage.getViewport(scale);

    				// prepare canvas using PDF page dimensions
    				// and render PDF page into canvas context
					page.node.canvas.height = viewport.height;
					page.node.canvas.width = viewport.width;

					var renderContext = {
						canvasContext: page.node.canvas.getContext('2d'),
						viewport: viewport
					};
					pdfpage.render(renderContext);
					page.node.canvas.style.visibility = 'visible';
				});
			});
		},

		pageFirst: function() {
			if(book) {
				this.pageOpen(0);
			}
		},

		pageLast: function() {
			if(this.book) {
				this.pageOpen(pages.length-1);
			}
		},

		pageNext: function() {
			if(page && page.index<pages.length-1) {
				this.pageOpen(page.index+1);
			}
		},

		pagePrev: function() {
			if(page && page.index>0) {
				this.pageOpen(page.index-1);
			}
		},

		bookClose: function() {
			page = null;
			pages = [];
			book = null;
			nodeContent.innerHTML = '';
			nodePageCurrent.value = '0';
			nodePageTotal.innerHTML = '0';
			nodeBookmarkSelect.innerHTML = '';
			utils.classes.remove(nodeBookmarkToggle, 'selected');
		},

		bookOpen: function(url) {
			this.bookClose();

			console.log("bookOpen: url = " + BACKEND_URL + url);

			utils.ajax({
				'url': BACKEND_URL+url,

				success: function(e) {
					e.response = utils.parseJson(e.response);
					if(e.response == null) {throw new Error('Ajax result can not be parsed');}
					if(e.response.status != "OK") {
						// TODO: высовывать попап с ошибкой
						throw new Error('ERROR: ' + response.error);
					}
					book = utils.clone(e.response);
				
					nodePageTotal.innerHTML = book.spine.length;

					// Fill pages array
					book.spine.forEach(function(page, index) {
						pages.push({
							id: page.X,
							index: index,
							number: index+1, // a kind of overhead, but convenient
							url: page.L,
							node: { // in case of more than only canvas node
								canvas: null
							},
							state: {
								bookmarked: !!page.B
							}
						});
					});
					
					// Open first page
					this.pageFirst();

				}.bind(this),

				error: function(e) {
					throw new Error('bookOpen() :: Ajax error with status ' + e.status);
				}
			});
		},

		fullscreenToggle: function() {
			if(!isFullscreenSupported) return;
			isFullscreened ? fullscreenExit() : fullscreenEnter();
		},

		bookmarkToggle: function() {
			if(page) {
				console.log(11);
				page.state.bookmarked = !page.state.bookmarked;
				utils.classes[page.state.bookmarked ? 'add' : 'remove'](nodeBookmarkToggle, 'selected');
				// TODO: send data to server
			}
		}

	}, { // Object interface

		version: '0.0.1'

	}];
});

// Init

utils.ready(function() {
	var reader = new Reader();

	reader.bookOpen('pdftest_en.json');
	// reader.bookOpen('pdftest_ru.json');
	// reader.bookOpen('pdffail.json');
	reader.pageFirst();
});
