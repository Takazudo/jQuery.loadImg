/*!
 * jQuery.loadImg
 *
 * @author    : Takeshi Takatsudo (takazudo[at]gmail.com)
 * @copyright : Takeshi Takatsudo
 * @license   : The MIT License
 * @link      : https://github.com/Takazudo/jQuery.loadImg
 * @modified  : 2011/08/11
 * @version   : 0.1
 *
 * $.loadImg('somewhere/img.png').then(function($img){
 *     $('body').append($img);
 * },function(error){
 *     alert(error.msg);
 * });
 */
(function($, window, document, undefined){

/**
 * cachedFunction factory
 * see: http://msdn.microsoft.com/ja-jp/scriptjunkie/gg723713.aspx
 * about this cache way and fetchImg mechanism
 */
$.createCachedFunction = function(requestedFunction){
	var cache = {};
	return function(key){
		if(!cache[key]){
			cache[key] = $.Deferred(function(defer){
				requestedFunction(defer, key);
			}).promise();
		}
		return cache[key];
	};
};

/**
 * fetchImg
 */
$.fetchImg = $.createCachedFunction(function(defer, src){
	var img = new Image();
	function cleanUp(){
		img.onload = img.onerror = null;
	}
	defer.always(cleanUp);
	img.onload = function(){
		defer.resolve($(img));
	};
	img.onerror = function(){
		defer.reject({ msg: 'img load failed' });
	};
	img.src = src;
});

/**
 * $.loadImg
 */
(function(){
	var cache = {}; // $img stash
	$.loadImg = function(src){
		return $.Deferred(function(defer){
			$.fetchImg(src).then(function($img){
				if(!cache[src]){
					cache[src] = $img;
				}
				/* return loading finished img and
				   put cloned img into the stash */
				$cachedImg = cache[src];
				$cloned = $cachedImg.clone();
				cache[src] = $cloned;
				defer.resolve($cachedImg);
			}, function(error){
				defer.reject(error);
			});
		}).promise();
	};
})();

})(jQuery, this, this.document);
