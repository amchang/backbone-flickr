// requires John Resig's class script to be loaded first
(function(window){
	
	/**
	 * can only perform 1 ajax flickr request at a time, dosen't matter for what info
	 */
	var isFetching = false;
	
	/**
	 * Basic Controller for all rest calls
	 */
	var Controller = Class.extend({
	
		/**
		 * Default constructor, empty
		 */
		init: function(){},
		
		/**
		 * Base fetch for all flickr api calls
		 */
		fetch: function(params, callback){
			// no api call yet, go ahead
			if(!isFetching){
				isFetching = true;
				// add base params
				params.api_key = '9e472a1785802bf94e41e06931c64c00';
				params.format = 'json';
				// ajax request, can handle disconnects
				$.ajax({
					url: 'http://api.flickr.com/services/rest/',
					type: 'GET',
					dataType: 'jsonp',
					data: params,
					jsonp: 'jsoncallback',
					success: function(data){
						callback(data);
						isFetching = false;
					},
					// still call the callback, callbacks need to handle bad or no data
					error: function() {
						callback();
						isFetching = false;
					}
				});
			}
		}
		
	});
	
	/**
	 * Controller build specifically for full text searches
	 */
	var SearchController = Controller.extend({
	
		/**
		 * Default constructor
		 */
		init: function(){
			this._super();
		},
		
		/**
		 * Fetch an api call for image search
		 * @param params the params for the full search, not null or undefined, plain object
		 * @param callback the callback to call post call, not null or undefined
		 */
		fetch: function(params, callback){
			params.per_page = 30;
			params.method = 'flickr.photos.search';
			this._super(params, callback);
		}
		
	});
	
	/**
	 * Controller build specifically for image info search
	 */
	var ImageController = Controller.extend({
	
		/**
		 * Default constructor, empty
		 */
		init: function(){
			this._super();
		},
		
		/**
		 * Fetch an api call for image info 
		 * @param id the id for the photo to look for, id is not null or undefined
		 * @param callback the callback to call post call, not null or undefined
		 */
		fetch: function(id, callback){
			var params = {
				photo_id: id,
				method: 'flickr.photos.getInfo'
			};
			this._super(params, callback);
		}
		
	});
	
	/**
	 * Handle the load spinner
	 */
	var Load = (function(){
		
		return {
		
			/**
			 * Show the load spinner
			 */
			show: function(){
				$("#load").removeClass('hidden')
			},
			
			/**
			 * Hide the load spinner
			 */
			hide: function(){
				$("#load").addClass('hidden')
			}
			
		};
	
	}());
	
	/**
	 * Image module
	 */
	var Image = (function(){
		
			// controller for this image module
		var localController = new ImageController(),
			// current photo list item reference and id
			ref = null,
			id = -1,
			// error message length
			errorLength = 1500,
			
			/**
			 * Render the html details for a photo
			 */
			listHtml = function(data) {
				var arr = [];
				// full blast for a list
				arr.push('<li><strong>By <a target="_blank" href="http://www.flickr.com/people/' + data.owner.nsid + '/">'+ data.owner.username +'</a></strong></li>');
				arr.push('<li>Taken on ' + data.dates.taken.split(' ')[0]  + '</li>');
				arr.push('<li>Viewed ' + data.views + ' times</li>');
				arr.push('<li><strong><a target="_blank" href="http://www.flickr.com/photos/' + data.owner.nsid + '/' + data.id + '">Link to this photo</a></strong></li>');
				arr.push('<li><input id="imgSave" type="button" value="Save" title="Save this photo so you can get back to it quickly!" />');
				arr.push('<input id="imgBack" type="button" value="Back" title="Return to search results" /></li>');
				return arr.join('');
			},
			
			/**
			 * Render the entire html for an images
			 * @param data the flickr data from an api call
			 */
			render = function(data) {
				var imgDetails, src;
				// either data is bad or dosen't exist
				if(!data || data.stat !== "ok") {
					$("#imgTitle, #imgDesc").html('');
					$("#imgMed").html('<h6>There was an error fetching your image. <br/> <a>Click here to return to your search results.</a></h6>');
				// single photos
				} else {
					imgDetails = data.photo; 
					src = ref.attr('src').replace('_t.jpg', '.jpg');
					$("#imgMed").html('').append(ref.clone().attr('src', src));
					$("#imgTitle").html((imgDetails.title._content ? imgDetails.title._content : "No Title"));
					$("#imgDesc").html(imgDetails.description._content ? imgDetails.description._content : "No Description");
					$("#imgLong").html(listHtml(imgDetails));
				}
			},
			
			/**
			 * Bind the events necessary for a single photo page
			 */
			bindEvents = function(){
				// remember me
				$("#imgSave").click(function(){
					// only 1 error
					if(!ImageGallery.rememberPhoto(id, ref) && $("#imgSvError").size() === 0) {
						$("#imgLong").append('<li id="imgSvError" class="error">You\'ve saved this image already!</li>');
						$("#imgSvError").fadeOut(errorLength, function(){
							$(this).remove();
						});
					}					
				});
				// back to search results
				$("#imgBack").click(function(){
				// show hide as needed search results
					Image.hide();
					ImageGallery.showSearchResults();
					Pagnation.show();
					$(window).scrollTop(0);
				});
			};
	
		return {
		
			/**
			 * Show image details
			 */
			show: function(){
				$("#imgDetail").removeClass('hidden');
			},
		
			/**
			 * Hide the image details if there are any
			 */
			hide: function(){
				$("#imgDetail").addClass('hidden');
			},
		
			/**
			 * Init the module
			 * @param reference to the image to display
			 */
			init: function(tar){
				Load.show();
				// reset vars
				ref = tar;
				id = ref.parent().data('id');
				// fetch data
				localController.fetch(id, function(data){
					Load.hide();
					render(data);
					bindEvents();
					// show
					Image.show();
				});
			}
			
		};
	}());
	
	/**
	 * Pagnation module
	 */
	var Pagnation = (function(){
	
		// show pagnation pages
		var pagnationAxis = 2,
			// are events bound
			eventsBound = false,
			// where pagnation is set
			currentPage = 1,
			maxPage = 1,
			// prevent double paging
			isPaging = false,
			
			/**
			 * Bind events for pagnation, only run in init
			 */
			bindEvents = function(){
				// resort to default term, resort to current closure for values
				$("#pages").click(function(e){
					var tar = $(e.target);
					// good link not selected
					if(!tar.hasClass('active') && tar.is('a') && !isPaging) {
						Search.searchPhotos(null, tar.attr('id').split('_')[1]);
						$(window).scrollTop(0);
						isPaging = true;
					}
				});
				// previous page
				$("#prevPage").click(function(){
					if(currentPage > 1) {
						Search.searchPhotos(null, currentPage - 1);
						$(window).scrollTop(0);
						isPaging = true;
					}
				});
				// next page
				$("#nextPage").click(function(){
					if(currentPage < maxPage) {
						Search.searchPhotos(null, currentPage + 1);
						$(window).scrollTop(0);
						isPaging = true;
					}
				});
			},
			
			/**
			 * Show / Hide pagnation buttons
			 * @param data the data for photo rendering
			 */
			showHideButtons = function(){
				// show / hide the previous buttons
				if(currentPage === 1) {
					$("#prevPage").addClass('hidden');
				} else {
					$("#prevPage").removeClass('hidden');
				}
				if(currentPage === maxPage) {
					$("#nextPage").addClass('hidden');
				} else {
					$("#nextPage").removeClass('hidden');
				}
			},
			
			/**
			 * Render the html for pagnation
			 */
			render = function() {
				var bottom, top, arr = []; 
				// bottom
				if(currentPage - pagnationAxis <= 1 || currentPage - (pagnationAxis * 2) === 0) {
					bottom = 1;
				// top
				} else if(currentPage + pagnationAxis >= maxPage) {
					arr.push('...');
					bottom = maxPage - (pagnationAxis * 2);
				} else {
					arr.push('...');
					bottom  = currentPage - pagnationAxis;
				}
				// top is middle + bottom + top difference
				top = bottom + pagnationAxis * 2 >= maxPage ? maxPage : bottom + pagnationAxis * 2;
				// generate each page button as needed
				for(bottom; bottom <= top; bottom++) {
					if(currentPage === bottom) {
						arr.push('<a class="active page" id="page_' + bottom + '">' + bottom + '</a>');
					} else {
						arr.push('<a class="page" id="page_' + bottom + '">' + bottom + '</a>');
					}
				}
				// ... more
				if(currentPage + pagnationAxis < maxPage && maxPage > pagnationAxis * 2 + 1) {
					arr.push('...');
				}
				$("#pages").html(arr.join(''));
			};
	
		return {
		
			/**
			 * Hide pagnation
			 */
			hide: function(){
				$("#pagnation").addClass('hidden');
			},
			
			/**
			 * Show pagnation
			 */
			show: function(){
				// need to show some pages
				if(maxPage > 0) {
					$("#pagnation").removeClass('hidden');
				}
			},
		
			/**
			 * Setup pagnation for a gallery
			 * @param data from a recent search flickr text search api
			 */
			init: function(data) {
				// if data is false or no photos or bad return rest api
				if(!data || data.stat !== "ok" || data.photos.photo.length === 0) {
					Pagnation.hide();
					$("#results").html('Total Photos Found: 0');
					// no pages
					maxPage = 0;
					return;
				}
				currentPage = data.photos.page;
				maxPage =  data.photos.pages;
				if(!eventsBound) {
					bindEvents();
					eventsBound = true;
				}
				// done loading set singleton variables
				Pagnation.show();
				showHideButtons();
				render();
				$("#results").html('Total Photos Found: ' + data.photos.total);
				// prevent locking
				isPaging = false;
			}
			
		};
	}());
	
	
	/**
	 * Image Gallery module
	 */
	var ImageGallery = (function(){
	
		// have i done the initial init
		var eventsBound = false,
			// max length of image gallery list title
			titleLength = 19,
			
			/**
			 * Build up the html for a set of images
			 * @param arr the image data for a set of photos as array, should be defined
			 * @return jquery document fragment of the entire list
			 */
			imageBuilder = function(arr) {
				// build up the array
				var builder = $('<ul><li><h6>Search Results</h6></li></ul>'), c, data, start = [];
				for(c = 0; c < arr.length; c++) {
					data = arr[c];
					// go through data
					start.push('<li class="image">');
					start.push('<img src="');
					start.push('http://farm' + data.farm + '.static.flickr.com/' + data.server + '/'); 
					start.push(data.id + '_' + data.secret + '_' + 't' + '.jpg' + '"/>');
					if(data.title !== "" && data.title.length < titleLength) {
						start.push("<p>" + data.title + "</p>");
					} else if(data.title !== "") {
						start.push("<p>" + data.title.substring(0, titleLength - 3) + "...</p>");  
					} else {
						start.push('<p>No Title</p>');
					}
					start.push("</li>");
					builder.append($(start.join('')).data('id', data.id));
					start = [];
				}
				// jq object here
				return builder;
			},
			
			/**
			 * Display an image gallery based on a set of data from flickr
			 * @param data from server search request, can be null or undefined 
			 */
			render = function(data){
				// one var
				var imgs = $("#images");
				// if data is false, assume bad
				if(!data || data.stat !== "ok") {
					imgs.html('<li><h6>There was an error with your search. Please try and search again.</h6></li>');
				// no photos
				} else if(data.photos.photo.length === 0) {
					imgs.html('<li><h6>No photos found. Please try and search again.</h6></li>');
				// photos
				} else {
					// get fragment children
					imgs.html('').append(imageBuilder(data.photos.photo).children());
				}
			};
			
		return {
		
			/**
			 * Save a photo to the saved photolist
			 * @param id the id of a photo to save
			 * @param ref a reference to the thumbnail of an image we want to save from a set of search results
			 * @return boolean whether or not was able to save or not
			 */
			rememberPhoto: function(id, ref){
				var found = false;
				// simple search, should sort for large cases
				$("#saved > li.image").each(function(){
					if($(this).data('id') === id) {
						found = true;
						// stop it
						return false;
					}
				});
				// is it currently already saved?
				if(!found && ref) {
					$("#saved").append(ref.parent().clone(true));
					// show one error
				} else {
					return false;
				}
				return true;
			},
		
			/**
			 * Show search results
			 */
			showSearchResults: function(){
				$("#images").removeClass('hidden');
			},
			
			/**
			 * Hide search results
			 */
			hideSearchResults: function(){
				$("#images").addClass('hidden');
			},
		
			/**
			 * Module items which need to be run once
			 * @param data flickr api data for a photo search as json
			 */
			init: function(data){
				render(data);
				if(!eventsBound) {
					// event delegate
					$("#saved, #images").click(function(e){
						var tar = $(e.target);
						if(tar.is("img")) {
							ImageGallery.hideSearchResults();
							Pagnation.hide();
							Image.init(tar);
							$(window).scrollTop(0);
						}
					}).removeClass('hidden');
					// logo reload
					$("#logo").click(function(){
						window.location.reload();
					}).addClass('post');
					eventsBound = true;
				} else {
					ImageGallery.showSearchResults();
				}
				// pagnation
				Pagnation.init(data);
			}
			
		};
	
	}());
	
	/**
	 * Search module
	 */
	var Search = (function(){
	
		// local copy of controller
		var localController = new SearchController(),
			// events bound
			eventsBound = false,
			// current term and page
			searchTerm = '',
			
			/**
			 * Function to wrap interaction around controller
			 * @param text the text to search for, can be blank etc.
			 * @param page the target page for the search term, can be undefined etc.
			 */
			privateSearch = function(text, page) {
				Load.show();
				localController.fetch({
					text: text, 
					page: page ? page : 1
				}, function(data) {
					ImageGallery.init(data);
					Load.hide();
				});
			};
	
		return {
		
			/**
			 * Search for photos
			 * @param text the text to search for
			 * @param page the target page for the search term
			 */
			searchPhotos: function(text, page){
				// if it could possibly use false, override with past
				searchTerm = text ? text : searchTerm;
				// static fetch and callback
				privateSearch(searchTerm, page);
			},
			
			/**
			 * Module items which need to be run once
			 */
			init: function(){
				// if I haven't bound events
				if(!eventsBound) {
					$("#search").submit(function(){
						Image.hide();
						// ensure not initial anymore
						$("#header").removeClass('initial');
						searchTerm = $("#searchText").val();
						privateSearch(searchTerm, null);
						$(window).scrollTop(0);
						return false;
					});
					eventsBound = true;
				}
			}
			
		};
	}());
	
	/**
	 * Run as soon as the page as loaded
	 */
	$(window.document).ready(function(){
		Search.init();
	});
	
}(window));