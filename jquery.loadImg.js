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
 * $.createCachedFunction
 *
 * is a cachedFunction factory.
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
 * $.fetchImg
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

/**
 * $.calcNaturalWH
 */
(function(){

	/* create tempholder */

	var $tempholder;
	var $tempholderSetup = function(){
		return $.Deferred(function(defer){
			$(function(){
				$tempholder = $('<div id="calcNaturalWH-tempholder"></div>').css({
					left: '-9999px',
					top: '-9999px'
				});
				$('body').append($tempholder);
				defer.resolve();
			});
		}).promise();
	};

	/* storage */

	var cache = {};

	/* core */

	$.calcNaturalWH = $.createCachedFunction(function(defer, src){
		$.loadImg(src).then(function($img){
			var img = $img[0];
			var res = {};
			if(img.naturalWidth !== undefined){
				res.width = img.naturalWidth;
				res.height = img.naturalHeight;
				cache[src] = res;
				defer.resolve(res);
			}else{
				$tempholderSetup().done(function(){
					$tempholder.append($img);
					res.width = $img.width();
					res.height = $img.height();
					cache[src] = res;
					$tempholder.empty();
					defer.resolve(res);
				});
			}
		}, function(msg){
			defer.reject(msg);
		});
	});

	/* bridge */

	$.fn.calcNaturalWH = function(){
		var $img = this;
		var src = $img.attr('src');
		return $.calcNaturalWH(src);
	};

})();

/**
 * $.PresetPreloader
 */
$.PresetPreloader = function(){
	this._presets = {};
	this._fetchImgPromises = {};
};
$.PresetPreloader.prototype = {
	register: function(presets){
		$.extend(this._presets, presets);
	},
	load: function(presetKey, originalSrc){
		var preset = this.get(presetKey);
		if(!preset){
			log('$.PresetPreloader detected unregistered preset.');
			return false;
		}
		var id = originalSrc ? presetKey + '$' + originalSrc : presetKey;
		if(this._fetchImgPromises[id] !== undefined){
			return true;
		}
		this._fetchImgPromises[id] = this._fetchMultiImgs(presetKey, originalSrc);
		return true;
	},
	_fetchMultiImgs: function(presetKey, originalSrc){
		var presetVals = this._presets[presetKey];
		var promises = [];
		$.each(presetVals, function(i, presetVal){
			var src;
			if($.isArray(presetVal) && originalSrc){
				src = String.prototype.replace.apply(originalSrc, presetVal);
			}else{
				src = presetVal;
			}
			promises.push( $.fetchImg(src) );
		});
		return $.when.apply(this, promises).pipe($.noop, function(){
			$.error('PresetPreloader failed loading preset: ' + presetKey);
		});
	},
	get: function(presetKey){
		var preset = this._presets[presetKey];
		if(preset === undefined){
			$.error('presetKey: ' + presetKey + ' is not registered yet.');
			return false;
		}
		return preset;
	}
};
$.presetPreloader = new $.PresetPreloader; /* create this instance immediately */

/**
 * $.fn.presetPreload
 */
$.fn.presetPreload = function(){
	return this.each(function(){
		var $el = $(this);
		var presetKey = $el.data('presetpreloadKey');
		var originalSrc = null;
		if($el.data('presetpreloadUsesrc')){
			originalSrc = $el.attr('src');
		}
		if($el.data('presetpreloadUsechildimg')){
			originalSrc = $el.find('img').eq(0).attr('src');
		}
		$.presetPreloader.load(presetKey, originalSrc);
	});
};

})(jQuery, this, this.document);
