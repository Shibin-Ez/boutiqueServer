-- Drop tables in the order of dependencies to avoid foreign key errors
DROP TABLE IF EXISTS Comment;
-- DROP TABLE IF EXISTS `Like`;
-- DROP TABLE IF EXISTS Post;
-- DROP TABLE IF EXISTS Shop;
-- DROP TABLE IF EXISTS User;

--@block Create User table
CREATE TABLE User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
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
select * FROM `Like`;

--@block
DELETE FROM Post WHERE id = 3