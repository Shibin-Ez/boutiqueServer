-- Drop tables in the order of dependencies to avoid foreign key errors
-- DROP TABLE IF EXISTS Comment;
-- DROP TABLE IF EXISTS `Like`;
-- DROP TABLE IF EXISTS Post;
-- DROP TABLE IF EXISTS Shop;
-- DROP TABLE IF EXISTS User;
-- DROP TABLE IF EXISTS UserNotification;
DROP TABLE IF EXISTS ShopNotification;

--@block Create User table
CREATE TABLE User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    profilePicURL VARCHAR(255) DEFAULT 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
    phone_no VARCHAR(50) UNIQUE,
    passwordHash VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

--@block Create Shop table
CREATE TABLE Shop (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('botique', 'designer_shop', 'maggum_works') NOT NULL DEFAULT 'botique',
    profilePicURL VARCHAR(255),
    userId INT NOT NULL,
    address VARCHAR(255) NOT NULL,
    whatsapp_no VARCHAR(50) NOT NULL,
    location POINT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    SPATIAL INDEX idx_shop_location (location),
    INDEX idx_shop_userId (userId)
) ENGINE=InnoDB;

--@block Create Post table
CREATE TABLE Post (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    fileURL1 VARCHAR(255) NOT NULL,  -- Mandatory file URL
    fileURL2 VARCHAR(255) DEFAULT NULL,
    fileURL3 VARCHAR(255) DEFAULT NULL,
    fileURL4 VARCHAR(255) DEFAULT NULL,
    fileURL5 VARCHAR(255) DEFAULT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    discount_price DECIMAL(10,2) CHECK (discount_price >= 0),
    description TEXT NOT NULL,
    shopId INT NOT NULL,
    size VARCHAR(50), -- is needed ?
    category VARCHAR(100) DEFAULT "none", -- think of a category table ?
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE,
    INDEX idx_post_shopId (shopId),
    CHECK (discount_price < price)
) ENGINE=InnoDB;

--@block Create Like table (named as `Like` because it is a reserved word, so we use backticks)
CREATE TABLE `Like` (
    userId INT NOT NULL,
    postId INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userId, postId),
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (postId) REFERENCES Post(id) ON DELETE CASCADE,
    INDEX idx_like_postId (postId)
) ENGINE=InnoDB;

--@block Create Follow table
CREATE TABLE Follow (
    userId INT NOT NULL,
    shopId INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userId, shopId),
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE,
    INDEX idx_follow_shopId (shopId)
) ENGINE=InnoDB;

--@block Create Comment table
CREATE TABLE Comment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    postId INT NOT NULL,
    comment TEXT NOT NULL,
    rating INT CHECK (rating >= 0 AND rating <= 5),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (postId) REFERENCES Post(id) ON DELETE CASCADE,
    UNIQUE KEY (postId, userId)
) ENGINE=InnoDB;

--@block Create Chat table
CREATE TABLE Chat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    senderId INT NOT NULL,
    receiverId INT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
     -- Indexes for Faster Queries
    INDEX idx_chat_sender_receiver (senderId, receiverId), -- Composite index for faster retrieval
    INDEX idx_chat_timestamp (timestamp), -- Helps with sorting messages efficiently

    FOREIGN KEY (senderId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (receiverId) REFERENCES User(id) ON DELETE CASCADE
) ENGINE=InnoDB;

--@block Create table Notification
CREATE TABLE UserNotification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    senderShopId INT NOT NULL,
    receiverId INT NOT NULL,
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_userNotification_receiverId (receiverId),

    FOREIGN KEY (senderShopId) REFERENCES Shop(id),
    FOREIGN KEY (receiverId) REFERENCES User(id) ON DELETE CASCADE
) ENGINE=InnoDB;

--@block Create table Notification
CREATE TABLE ShopNotification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    senderId INT NOT NULL,
    receiverShopId INT NOT NULL,
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_shopNotification_receiverShopId (receiverShopId),

    FOREIGN KEY (senderId) REFERENCES Shop(id),
    FOREIGN KEY (receiverShopId) REFERENCES User(id) ON DELETE CASCADE
) ENGINE=InnoDB;

--@block Create ShortURL table
CREATE TABLE ShortURL (
    id INT AUTO_INCREMENT PRIMARY KEY,
    short VARCHAR(10) NOT NULL UNIQUE,
    long VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


--@block insert into User table
INSERT INTO User (name, email, phone_no, passwordHash) VALUES ('admin', 'abc@123', '1234567890', 'admin');

--@block
insert into `Like` (userId, postId) VALUES (2, 4);

--@block
select * FROM Chat;

--@block
DELETE FROM Post WHERE id = 3

--@block
ALTER TABLE User ADD COLUMN profilePicURL VARCHAR(255) DEFAULT 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

--@block
SHOW CREATE TABLE User;


--@block
ALTER TABLE User DROP INDEX name;

--@block
DESCRIBE UserNotification;

--@block
SELECT * 
FROM User u
WHERE EXISTS (
    SELECT 1 FROM Chat c WHERE c.senderId = 8 OR c.receiverId = 8
);

--@block
SELECT 
    c1.senderId, 
    u.name AS senderName,
    u.profilePicURL,
    c1.content AS lastMessage,
    c1.timestamp
FROM Chat c1
JOIN User u ON c1.senderId = u.id
WHERE c1.id = (
    SELECT MAX(c2.id) 
    FROM Chat c2 
    WHERE (c2.senderId = c1.senderId AND c2.receiverId = 2) OR (c2.senderId = 2 AND c2.receiverId = c1.receiverId)  -- Replace ? with the userId
)
ORDER BY c1.timestamp DESC;

--@block
SELECT *
FROM User u
JOIN Chat c ON u.id = c.senderId OR u.id = c.receiverId
WHERE c.senderId = 2 OR c.receiverId = 2

--@block
SELECT 
    u.id AS userId,
    u.name AS userName,
    u.profilePicURL,
    c.id AS lastMessageId,
    c.content AS lastMessage,
    c.timestamp AS lastMessageTime,
    c.senderId,
    c.receiverId
FROM Chat c
JOIN User u ON (u.id = c.senderId OR u.id = c.receiverId) 
WHERE (c.senderId = 2 OR c.receiverId = 2) 
AND u.id != 2  -- Exclude the user themselves
AND c.timestamp = (
    SELECT MAX(c2.timestamp) 
    FROM Chat c2 
    WHERE (c2.senderId = u.id AND c2.receiverId = 2) 
       OR (c2.receiverId = u.id AND c2.senderId = 2)
)
ORDER BY c.timestamp DESC;
