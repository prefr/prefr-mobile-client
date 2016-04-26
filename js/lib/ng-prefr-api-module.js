"use strict"

angular.module('ngPrefrApi', ['ng'])
	
.provider('ngPrefrApi', function(){
	if(typeof prefrApi != 'function'){
		console.error('ngPrefrApi: missing prefrApi, try loading prefr-api.js')
		return null
	}

	var api_url = '/'

	this.setApiUrl = 	function(url){
							api_url = url
							return this
						}

	this.$get 		=	function(){
							return new prefrApi(api_url)
						}

})
	