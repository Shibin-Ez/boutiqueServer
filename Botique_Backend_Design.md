# Botique app backend

### Tech stack

- Node.js
- Express.js
- MySQL
- JWT token based authentication

### Database models

1. User
	- id
	- name
	- email
	- phone no
	- passwordHash
	- sellerId (null if not seller)
	- timestamp

2. Shop
	- id
	- name
	- type
	- userId
	- address
	- whatsapp no
	- location
	- timestamp

3. Post
	- id
	- title
	- fileURLs (5 colums) (1st mandatory, rest null by default)
	- price
	- discount price ( < orginial price )
	- description
	- shopId
	- size
	- category
	- timestamp

4. Like
	- userId
	- postId
	- timestamp

5. Follow
	- userId
	- shopId
	- timestamp


### API Endpoints

1. User
	- POST /user/register
	- POST /user/login
	- GET /user/:id
	- GET /user/:id/feed
	- GET /user/:id/nearby
	- PUT /user/:id
	- DELETE /user/:id

2. Shop
	- POST /shop
	- GET /shop/:id
	- PUT /shop/:id
	- DELETE /shop/:id

3. Post
	- POST /post
	- GET /post/:id
	- PUT /post/:id
	- DELETE /post/:id

4. Likes
	- POST /like
	- DELETE /like/:id

5. Follow
	- POST /follow
	- GET /follows/:userId
	- GET /followers/:shopId
	- DELETE /follow/:id


### Authentication

- JWT token based authentication
- all endpoints should be authenticated except
	- POST /user/register
	- POST /user/login
	- GET /post/:id
	- GET /shop/:id
- token should be passed in header as `Authorization: Bearer


### Functions

1. User
	
	1. **createUser**
		- input: name, email, phone no, password
		- output: user object
		- constrains
			- email should be unique
			- phone no should be unique
			- name should be unique

	2. **getUser**
		- input: id
		- output: user object (without passwordHash)

	3. **updateUser**
		- input: id, name (only name can be updated)
		- output: updated user object

	4. **deleteUser**
		- input: id
		- output: success message
		- delete shop and posts of the user

	5. **login**
		- input: email, password (or social login)
		- output: user object + token
		- constrains
			- email should be valid
			- password should be valid

	6. **getFeed**
		- input: id
		- output: list of posts from
			- the shops the user follows
			- the shops close to the user
			- trending posts
			- recent posts
		- should be paginated (10 posts per page)

	7. **getNearbyShops**
		- input: id
		- output: list of shops close to the user
		- should be paginated (10 shops per page)

2. Shop

	1. **createShop**
		- input: name, type, userId, address, whatsapp no, location
		- output: shop object

	2. **getShop**
		- input: id
		- output: shop object
		- any logged in user can get any shop

	3. **updateShop**
		- input: id + oneOrMoreOf( name, type, address, whatsapp no, location )
		- output: updated shop object

	4. **deleteShop**
		- input: id
		- output: success message
		- delete posts of the shop

3. Post

	1. **createPost**
		- input: userId, title, fileURLs, price, discount price, description, shopId, size, category
		- output: post object

	2. **getPost**
		- input: id
		- output: post object

	3. **updatePost**
		- input: id + oneOrMoreOf( title, fileURLs, price, discount price, description, size, category )
		- output: updated post object

	4. **deletePost**
		- input: id
		- output: success message

4. Likes

	1. **likePost**
		- input: userId, postId (both should be valid) (the combination must be unique)
		- output: success message

	2. **unlikePost**
		- input: userId, postId
		- output: success message

	3. **getLikes**
		- input: postId
		- output: list of userIds who liked the post

	4. **getLikedPosts**
		- input: userId
		- output: list of postIds liked by the user

5. Follow

	1. **followShop**
		- input: userId, shopId (both should be valid) (the combination must be unique)
		- output: success message

	2. **unfollowShop**
		- input: userId, shopId
		- output: success message

	3. **getFollowers**
		- input: shopId
		- output: list of userIds who follow the shop

	4. **getFollowedShops**
		- input: userId
		- output: list of shopIds followed by the user


### Strategies

1. **getting user location**
	- bydefault figure out the location from the IP address
	- ask user to enter location
	- ask user to enable permission to get location