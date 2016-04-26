"use strict";

(function(){

	//mock
	var ballot_data = 	{
							"id":			"BJ5MHcH0d6IzwMcTVbI2",
							"subject":		"What is the subject line?",
							"details":		"Thee are the subjects details.",
							"options":		[
												{"tag":"A","title":"LAN Party","details":""},
												{"tag":"B","title":"Blue","details":""},
												{"tag":"C","title":"Yesterday","details":""},
												{"tag":"D","title":"Cheesecake","details":""}
											],
							"papers":		[
												{
													"id":			"FsMOnWzVRCiU7lO8TwIy",
													"ranking":		[["B"],["A","C"],["D"]],
													"participant":	"Particpant 1",
													"created":		1448732809770
												},
												{
													"id":			"Va3p39pF7eiSarbP1ghP",
													"ranking":		[["A"],["C","D","B"]],
													"participant":	"Participant 2",
													"created":		1448732905677
												}
											],
							"createDate":	1448732806571
						}




	function prefrBallot(data){

		var self = JSON.parse(JSON.stringify(data))


		self.papers.get 		= 	function(id){
										return 	self.papers.filter(function(paper){
													return paper.id == id
												})[0]
									}



		self.papers.forEach(function(paper){
			paper.fix			=	function(){

										paper.ranking  = 	paper.ranking.filter(function(rank){
																return rank.length > 0
															})


										var unranked		=	self.options.filter(function(option){
																	return 	paper.ranking.every(function(rank){
																				return 	rank.every(function(tag){
																							return tag != option.tag
																						})
																			})
																})
																.map(function(option){
																	return option.tag
																}),
											status_quo_rank = 	paper.ranking.filter(function(rank){
																	return 	rank.some(function(tag){
																				return parseInt(tag) == 0
																			})
																})[0]


										if(unranked.length != 0){
											!!status_quo_rank
											?	[].push.apply(status_quo_rank, unranked)
											:	paper.ranking.push(unranked)
										}

									}
		})


		self.options.get		=	function(tag){
										return	self.options.filter(function(option){
													return option.tag == tag
												})
									}

		self.stringify			= 	function(){
										return JSON.stringify(self)
									}

		return self
	}




	//console.log(new prefrBallot(ballot_data).stringify())



	function prefrApi(url){
		var self 	= this,
			url 	= url

		function api_call(method, path, data, callback){

			var xhr 	= new XMLHttpRequest(),
				path	= path.replace(/^\//,'')


			xhr.open(method, url + '/' + path)


			return 	new Promise(function(resolve, reject){

						xhr.send(JSON.stringify(data))

						xhr.onload = function(){
							var response_object

							try{
								response_object = JSON.parse(xhr.response)
							} catch(e) {
								reject(e)
							}

							if(xhr.status == "200") resolve(response_object)
							if(xhr.status != "200") reject()
						}

						xhr.onerror = function(e){
							reject(e)
						}

					})

		}


		self.getBallot 		= 	function(id){

									if(!id) return Promise.reject('prefrApi.getBallot: missing id')

									return 	api_call('GET', '/ballotBox/'+id)
											.then(function(result){
												return prefrBallot(result)
											})
								}

		self.createBallot	=	function(ballot_data){

									var data	= 	{
														subject: 	ballot_data.subject || undefined,
														details:	ballot_data.details || undefined,
														options:	ballot_data.options || undefined,
														papers:		ballot_data.papers	|| undefined
													}

									return api_call('POST', '/ballotBox', data)
								}

		self.updateBallot	=	function(ballot_data){

									if(!ballot_data) 				return Promise.reject('prefrApi.updateBallot: missing ballot_data')
									if(!ballot_data.id) 			return Promise.reject('prefrApi.updateBallot: missing id')
									if(!ballot_data.adminSecret) 	return Promise.reject('prefrApi.updateBallot: missing adminSecret')

									var data 	=	{
														id:				ballot_data.id,
														adminSecret:	ballot_data.adminSecret,
														deltails:		ballot_data.details	|| undefined,
														subject:		ballot_data.subject	|| undefined,
														options:		ballot_data.options	|| undefined
													}

									return api_call('PUT', '/ballotBox/' + data.id, data)

								}


		self.lockBallot		=	function(ballot_data){

									if(!ballot_data) 				return Promise.reject('prefrApi.lockBallot: missing ballot_data')
									if(!ballot_data.id) 			return Promise.reject('prefrApi.lockBallot: missing id')
									if(!ballot_data.adminSecret) 	return Promise.reject('prefrApi.lockBallot: missing adminSecret')
									
									var data	=	{
														id: 			ballot_data.id,
														adminSecret:	ballot_data.adminSecret
													}

									return api_call('POST', '/ballotBox/' + data.id + '/lock', data)

								}

		self.updatePaper	=	function(box_id, paper_data){

									if(!box_id)				return Promise.reject('prefrApi.savePaper: missing box id')
									if(!paper_data)			return Promise.reject('prefrApi.savePaper: missing paper_data')
									if(!paper_data.id)		return Promise.reject('prefrApi.savePaper: missing id')

									var data	=	{
														id:			 paper_data.id,
														ranking:	 paper_data.ranking,
														participant: paper_data.participant
													}

									return 	api_call('PUT', '/ballotBox/' + box_id + '/paper/' + data.id, data)											
								}


		self.newPaper		=	function(box_id, paper_data){

									paper_data = paper_data || {}

									if(!box_id)				return Promise.reject('prefrApi.savePaper: missing box id')

									var data	=	{
														ranking:		paper_data.ranking 		|| [[]],
														participant:	paper_data.participant 	|| ""
													}

									return api_call('POST', '/ballotBox/' + box_id + '/paper', data)
								}

	}


	window.prefrApi = prefrApi

})()

