APModDataSpy.getDataspyFilter = () => {
	return [
		{
			"name":"AR 2 DS41",
			"sort" :
			{
				"NAME" : "schedstartdate",
				"TYPE" : "ASC"
			},
			"filter" :
			[
				{
					"NAME"		: "equipment",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "OR",
					"VALUE"		: "AR.ZONE.2",
					"LPAREN"	: true,
					"RPAREN"	: false
				},
				{
					"NAME"		: "equipmentdesc",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "AND",
					"VALUE"		: "pakivaa02",
					"LPAREN"	: false,
					"RPAREN"	: true
				},
				{
					"NAME"		: "shift",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "AND",
					"VALUE"		: "DS41",
					"LPAREN"	: false,
					"RPAREN"	: false
				}
			]
		},
		{
			"name":"AR 2 DS42",
			"sort" :
			{
				"NAME" : "schedstartdate",
				"TYPE" : "ASC"
			},
			"filter" :
			[
				{
					"NAME"		: "equipment",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "OR",
					"VALUE"		: "AR.ZONE.2",
					"LPAREN"	: true,
					"RPAREN"	: false
				},
				{
					"NAME"		: "equipmentdesc",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "AND",
					"VALUE"		: "pakivaa02",
					"LPAREN"	: false,
					"RPAREN"	: true
				},
				{
					"NAME"		: "shift",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "AND",
					"VALUE"		: "DS42",
					"LPAREN"	: false,
					"RPAREN"	: false
				}
			]
		},
		{
			"name":"AR 2 DS43",
			"sort" :
			{
				"NAME" : "schedstartdate",
				"TYPE" : "ASC"
			},
			"filter" :
			[
				{
					"NAME"		: "equipment",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "OR",
					"VALUE"		: "AR.ZONE.2",
					"LPAREN"	: true,
					"RPAREN"	: false
				},
				{
					"NAME"		: "equipmentdesc",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "AND",
					"VALUE"		: "pakivaa02",
					"LPAREN"	: false,
					"RPAREN"	: true
				},
				{
					"NAME"		: "shift",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "AND",
					"VALUE"		: "DS43",
					"LPAREN"	: false,
					"RPAREN"	: false
				}
			]
		},
		{
			"name":"AR 3 DS41",
			"sort" :
			{
				"NAME" : "schedstartdate",
				"TYPE" : "ASC"
			},
			"filter" :
			[
				{
					"NAME"		: "equipment",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "OR",
					"VALUE"		: "AR.ZONE.3",
					"LPAREN"	: true,
					"RPAREN"	: false
				},
				{
					"NAME"		: "equipmentdesc",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "AND",
					"VALUE"		: "pakivaa03",
					"LPAREN"	: false,
					"RPAREN"	: true
				},
				{
					"NAME"		: "shift",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "AND",
					"VALUE"		: "DS41",
					"LPAREN"	: false,
					"RPAREN"	: false
				}
			]
		},
		{
			"name":"AR 3 DS42",
			"sort" :
			{
				"NAME" : "schedstartdate",
				"TYPE" : "ASC"
			},
			"filter" :
			[
				{
					"NAME"		: "equipment",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "OR",
					"VALUE"		: "AR.ZONE.3",
					"LPAREN"	: true,
					"RPAREN"	: false
				},
				{
					"NAME"		: "equipmentdesc",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "AND",
					"VALUE"		: "pakivaa03",
					"LPAREN"	: false,
					"RPAREN"	: true
				},
				{
					"NAME"		: "shift",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "AND",
					"VALUE"		: "DS42",
					"LPAREN"	: false,
					"RPAREN"	: false
				}
			]
		},
		{
			"name":"AR 3 DS43",
			"sort" :
			{
				"NAME" : "schedstartdate",
				"TYPE" : "ASC"
			},
			"filter" :
			[
				{
					"NAME"		: "equipment",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "OR",
					"VALUE"		: "AR.ZONE.3",
					"LPAREN"	: true,
					"RPAREN"	: false
				},
				{
					"NAME"		: "equipmentdesc",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "AND",
					"VALUE"		: "pakivaa03",
					"LPAREN"	: false,
					"RPAREN"	: true
				},
				{
					"NAME"		: "shift",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "AND",
					"VALUE"		: "DS43",
					"LPAREN"	: false,
					"RPAREN"	: false
				}
			]
		},
		{
			"name":"CEL",
			"sort" :
			{
				"NAME" : "schedstartdate",
				"TYPE" : "ASC"
			},
			"filter" :
			[
				{
					"NAME"		: "description",
					"OPERATOR"	: "CONTAINS",
					"JOINER"	: "AND",
					"VALUE"		: "CEL",
					"LPAREN"	: false,
					"RPAREN"	: false
				}
			]
		}
	]
}