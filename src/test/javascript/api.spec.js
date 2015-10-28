/*globals require*/

/* TODO - Frisby doesn't work with Jasmine 2.0. Find a way to make this test work again.
var frisby = require('frisby');

frisby.create('Get types of things')
    .get('http://localhost:8080/sqwerl/tcarroll/types')
    .expectStatus(200)
    .expectJSON({
        children: {
            limit: 10,
            members: [
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/groups",
                    id: "/types/groups",
                    name: "Groups"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/notes",
                    id: "/types/notes",
                    name: "Notes"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/papers",
                    id: "/types/papers",
                    name: "Papers"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/roles",
                    id: "/types/roles",
                    name: "Roles"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/tags",
                    id: "/types/tags",
                    name: "Tags"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/talks",
                    id: "/types/talks",
                    name: "Talks"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/users",
                    id: "/types/users",
                    name: "Users"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/videos",
                    id: "/types/videos",
                    name: "Videos"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/views",
                    id: "/types/views",
                    name: "Views"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/webPages",
                    id: "/types/webPages",
                    name: "WebPages"
                }
            ],
            offset: 0,
            totalCount: 19
        },
        createdOn: "2013-02-23T00:00:00.00-07:00",
        creator: {
            href: "http://localhost:8080/sqwerl/tcarroll/types/users/Administrator",
            id: "/types/users/Administrator",
            name: "Administrator"
        },
        name: "Types",
        owner: {
            href: "http://localhost:8080/sqwerl/tcarroll/types/users/Administrator",
            id: "/types/users/Administrator",
            name: "Administrator"
        },
        shortDescription: "Types of things. For example, books, people, categories, and web pages are different types of things.",
        href: "http://localhost:8080/sqwerl/tcarroll/types",
        id: "/types"
    }).toss();

frisby.create('Get web pages')
    .get('http://localhost:8080/sqwerl/tcarroll/types/webPages')
    .expectStatus(200)
    .expectJSON({
        children: {
            limit: 10,
            members: [
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/webPages/The Only Way to Raise Your Salary",
                    id: "/types/webPages/The Only Way to Raise Your Salary",
                    name: "The Only Way to Raise Your Salary"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/webPages/97 Things Every Programmer Should Know",
                    id: "/types/webPages/97 Things Every Programmer Should Know",
                    name: "97 Things Every Programmer Should Know"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/webPages/Youre the Boss",
                    id: "/types/webPages/Youre the Boss",
                    name: "You're the Boss: The Art of Running a Small Business"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/webPages/Youre a developer so why do you work for someone else",
                    id: "/types/webPages/Youre a developer so why do you work for someone else",
                    name: "You're a Developer, So Why do You Work for Someone Else?"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/webPages/Your Career Success Hinges on One Word Do You Know It",
                    id: "/types/webPages/Your Career Success Hinges on One Word Do You Know It",
                    name: "Your Career Success Hinges on One Word--Do You Know It?"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/webPages/Youll Never Believe how LinkedIn Built Its New iPad App",
                    id: "/types/webPages/Youll Never Believe how LinkedIn Built Its New iPad App",
                    name: "You'll Never Believe How LinkedIn Built Its New iPad App"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/webPages/You Cant Save Your Way to Innovation",
                    id: "/types/webPages/You Cant Save Your Way to Innovation",
                    name: "You can't save your way to innovation"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/webPages/You can increase your intelligence",
                    id: "/types/webPages/You can increase your intelligence",
                    name: "You can increase your intelligence"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/webPages/Yet Another DevonThink vs Yojimbo vs Evernote Thread",
                    id: "/types/webPages/Yet Another DevonThink vs Yojimbo vs Evernote Thread",
                    name: "Yet Another DEVONThink vs. Yojimbo vs. Evernote Thread"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/webPages/Yes but who said theyd actually buy the damn thing",
                    id: "/types/webPages/Yes but who said theyd actually buy the damn thing",
                    name: "Yes, but who said they'd actually BUY the damn thing?"
                }
            ],
            offset: 0,
            totalCount: 548
        },
        createdOn: "2013-02-05T00:00:00.00-07:00",
        creator: {
            href: "http://localhost:8080/sqwerl/tcarroll/types/users/tcarroll",
            id: "/types/users/tcarroll",
            name: "Tom Carroll"
        },
        name: "WebPages",
        owner: {
            href: "http://localhost:8080/sqwerl/tcarroll/types/users/tcarroll",
            id: "/types/users/tcarroll",
            name: "Tom Carroll"
        },
        isType: true,
        href: "http://localhost:8080/sqwerl/tcarroll/types/webPages",
        id: "/types/webPages"
    }).toss();

frisby.create('Test collections of single items are summarized as collections with total counts')
    .get('http://localhost:8080/sqwerl/tcarroll/types/papers/Performance%20Evaluation%20of%20Input%20Devices%20in%20Trajectory%20based%20Tasks')
    .expectJSON({
        authors: {
            limit: 10,
            members: [
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/authors/Johnny Accot",
                    id: "/types/authors/Johnny Accot",
                    name: "Johnny Accot"
                },
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/authors/Shumin Zhai",
                    id: "/types/authors/Shumin Zhai",
                    name: "Shumin Zhai"
                }
            ],
            offset: 0,
            totalCount: 2
        },
        categories: {
            limit: 10,
            members: [
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/categories/Computer Science/Human Computer Interaction",
                    id: "/types/categories/Computer Science/Human Computer Interaction",
                    name: "Human-Computer Interaction"
                }
            ],
            offset: 0,
            totalCount: 1
        },
        createdOn: "2012-04-13T00:00:00.00-07:00",
        creator: {
            href: "http://localhost:8080/sqwerl/tcarroll/types/users/tcarroll",
            id: "/types/users/tcarroll",
            name: "Tom Carroll"
        },
        description: "",
        name: "Performance Evaluation of Input Devices in Trajectory-based Tasks: An Application of The Steering Law",
        owner: {
            href: "http://localhost:8080/sqwerl/tcarroll/types/users/tcarroll",
            id: "/types/users/tcarroll",
            name: "Tom Carroll"
        },
        readBy: {
            limit: 10,
            members: [
                {
                    href: "http://localhost:8080/sqwerl/tcarroll/types/users/tcarroll",
                    id: "/types/users/tcarroll",
                    name: "Tom Carroll"
                }
            ],
            offset: 0,
            totalCount: 1
        },
        representations: {
            limit: 10,
            members: [ ],
            offset: 0,
            totalCount: 0
        },
        shortDescription: "",
        href: "http://localhost:8080/sqwerl/tcarroll/types/papers/Performance Evaluation of Input Devices in Trajectory based Tasks",
        id: "/types/papers/Performance Evaluation of Input Devices in Trajectory based Tasks"
    }).toss();
*/