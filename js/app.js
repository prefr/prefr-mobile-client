"use strict";

(function() {

	angular.module('PrefrMobile',[
		'ngRoute',
		//'ngTouch',
		//'ngAnimate',
		'PrefrMobileRanking',
		'ngPrefrApi',
	])

	.config([
		'$routeProvider',
		'$locationProvider',
		'$animateProvider',
		'ngPrefrApiProvider',

		function($routeProvider, $locationProvider, $animateProvider, ngPrefrApiProvider){

			if(!prefrConfig){
				console.error('missing prefr config. Please load config.js');
			}

			ngPrefrApiProvider
			.setApiUrl(prefrConfig.apiUrl) //from config.js

			$routeProvider
			.when(
				'/:boxId?/:adminSecret?',
				{
					templateUrl :   'partials/pick.html',
					controller  :   'ballotBoxPick',
					reloadOnSearch: false
				}
			)
			.when(
				'/ballotBox/:boxId/:adminSecret?',
				{
					templateUrl :   'partials/pick.html',
					controller  :   'ballotBoxPick',
					reloadOnSearch: false
				}
			)
			.when(
				'/:boxId/edit/:paperId',
				{
					templateUrl :   'partials/ranking_plain.html',
					controller  :   'ballotBoxEdit',
					reloadOnSearch: false
				}
			)
			.otherwise({
				redirectTo:     '/'
			})

			$animateProvider.classNameFilter(/ng-animate-enabled/);


			// use the HTML5 History API
			$locationProvider.html5Mode({
				enabaled: 		true,
				requireBase:	false 
			});

		}
	])
	.run(['$rootScope', function($rootScope){
		$rootScope.console = window.console
		$rootScope.$watch(function(){
			console.log('watch!')
		})
	}])

	.service('ballotBox',[
		'$rootScope',
		'$q',
		'ngPrefrApi',

		function($rootScope, $q, ngPrefrApi){

			var self				= this,
				current_paper_id	= undefined

			$rootScope.log 			= []

			this.setById		= 	function(box_id){	

										if(!box_id){
											delete $rootScope.ballot
											return $q.reject(undefined)
										}

										if($rootScope.ballot && $rootScope.ballot.id == box_id){
											return $q.resolve($rootScope.ballot)
										}

										return 	ngPrefrApi.getBallot(box_id)
												.catch(function(reason){console.warn(reason)})
												.then(function(ballot){
													$rootScope.ballot = ballot	
													return $q.resolve(ballot)
												})
									}

			this.setPaperById	= 	function(paper_id){
										if(paper_id && !$rootScope.ballot)	return $q.reject('no ballot set')

										$rootScope.activePaper = $rootScope.ballot.papers.get(paper_id) 

										if($rootScope.activePaper){
											$rootScope.activePaper.fix()
											return $q.resolve($rootScope.activePaper)
										} else {
											$q.reject('cannot find paper: '+paper_id)
										}

									}

			this.savePaper 		=	function(){
										if(!$rootScope.ballot || !$rootScope.ballot.id) return $q.reject('no ballot to save paper to')

										return 	ngPrefrApi
												.updatePaper($rootScope.ballot.id, $rootScope.activePaper)
												.catch(function(reason){console.warn(reason)})
									} 

			this.newPaper		=	function(){
										if(!$rootScope.ballot || !$rootScope.ballot.id) return $q.reject('no ballot to add new paper to')

										return	ngPrefrApi
												.newPaper($rootScope.ballot.id)
												.catch(function(reason){console.warn(reason)})
												.then(function(paper){
													$rootScope.ballot.papers.push(paper)
													return paper													
												})
									}


			this.log			= 	function(text){
										$rootScope.log.unshift(text)
									}
		}
	])


	.controller('ballotBoxPick',[
		'$scope',
		'$routeParams',
		'$location',
		'$q',
		'ballotBox', 

		function($scope, $routeParams, $location, $q, ballotBox){
 
			var box_id 		= $routeParams.boxId


			$scope.activePaper 	= undefined
			$scope.unranked		= undefined

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

			//mock:
			//$scope.ballot = ballot_data
			//
			ballotBox.setById(box_id)
			.then(function(ballot){
				$scope.$evalAsync()
			})
			.catch(function(){
				$scope.$evalAsync()

			})

			
			$scope.newPaper 	= 	function(){
										$q.resolve()
										.then(function(){
											return ballotBox.newPaper()
										})
										.then(function(paper){
											return $scope.editPaper(paper)
										})
									}


			$scope.editPaper 	= 	function(paper){
										$location.path('/' + box_id + '/edit/' + paper.id)
									}

		}
	])


	.controller('ballotBoxEdit',[

		'$scope',
		'$routeParams',
		'$location',
		'$q',
		'ballotBox', 

		function($scope, $routeParams, $location, $q, ballotBox){
			var box_id 		= $routeParams.boxId,
				paper_id 	= $routeParams.paperId


			$scope.ready	= false
			$scope.active 	= {}


			$q.resolve()
			.then(function(){
				return ballotBox.setById(box_id)
			})
			.then(function(){
				return ballotBox.setPaperById(paper_id)
			})
			.then(function(paper){
				$scope.unranked 	= 	[
											$scope.ballot.options.filter(function(option){
												return 	paper.ranking.every(function(rank){
															return rank.indexOf(option.tag) == -1
														})
											})
											.map(function(option){
												return	option.tag
											})
										]
				return paper
			})
			.then(function(){
				$scope.$watch('activePaper.participant', function(participant){
					if(!participant) $scope.nameModal = true
				})
				$scope.ready = true				
			})

			$scope.pickPaper = function(){
				ballotBox.setPaperById(undefined)
				$location.path('/' + box_id)
			}

			$scope.setName = function(){
				$scope.nameModal = true
			}

			$scope.moveOption = function(rank, after) {

				if(!$scope.active.rank){
					$scope.active.rank = rank
					return null
				}

				var active_rank_index 						= $scope.activePaper.ranking.indexOf($scope.active.rank),
					target_rank_index						= rank ? $scope.activePaper.ranking.indexOf(rank) : -1,
					move_option_into_same_rank				= $scope.active.rank == rank && !after,
					move_only_option_into_neighbour_rank	= !move_option_into_same_rank && $scope.active.rank.length <= 1 && (target_rank_index - active_rank_index) == (after ? 1 : 0),
					option_will_move						= !move_option_into_same_rank && !move_only_option_into_neighbour_rank,
					move_option_into_new_first_rank			= !rank && option_will_move,
					move_option_into_new_non_first_rank		=  rank && option_will_move &&  after,
					move_option_into_existing_rank			=  rank && option_will_move && !after



				if(option_will_move){
					var active_option_index	= $scope.active.rank.indexOf($scope.active.option)
					$scope.active.rank.splice(active_option_index,1)
				}




				if(move_option_into_new_first_rank){
					$scope.activePaper.ranking.unshift([$scope.active.option])
				}



				if(move_option_into_new_non_first_rank){
					$scope.activePaper.ranking.splice(target_rank_index+1, 0, [$scope.active.option])
				}



				if(move_option_into_existing_rank){
					rank.push($scope.active.option) 
				}


				$scope.activePaper.fix()

				$scope.active.rank 		= undefined
				$scope.active.option 	= undefined
			}

			$scope.save = function(){

				var status_quo_rank = 	$scope.activePaper.ranking.filter(function(rank){
											return rank.indexOf("0") !=-1
										})[0]

				if($scope.unranked[0].length != 0 ){
					!!status_quo_rank
					?	[].push.apply(status_quo_rank, $scope.unranked[0])
					:	$scope.activePaper.ranking.push($scope.unranked[0])

					$scope.unranked = [[]]
				}


				$q.resolve()
				.then(function(){
					return ballotBox.savePaper()
				})
				.then(function(){
					ballotBox.log('saved: ' + $scope.activePaper.participant)
					$scope.pickPaper()
				})

			}


		}
	])
})()