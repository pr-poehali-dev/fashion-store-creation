-- Создание таблицы для товаров
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы для отзывов
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- Добавление начальных данных для товаров
INSERT INTO products (name, price, description, image_url, category) VALUES
('Женская куртка ZARA', 8900.00, 'Стильная демисезонная куртка из качественных материалов', '/api/placeholder/400/400', 'outerwear'),
('Мужские джинсы LEVI''S', 6500.00, 'Классические джинсы прямого кроя из плотного денима', '/api/placeholder/400/400', 'pants'),
('Женское платье H&M', 2900.00, 'Легкое летнее платье из натурального хлопка', '/api/placeholder/400/400', 'dresses'),
('Мужская рубашка BOSS', 4200.00, 'Деловая рубашка из хлопка премиум качества', '/api/placeholder/400/400', 'shirts'),
('Женские кроссовки NIKE', 7800.00, 'Спортивные кроссовки для активного образа жизни', '/api/placeholder/400/400', 'shoes'),
('Мужской свитер UNIQLO', 3400.00, 'Теплый вязаный свитер из мериносовой шерсти', '/api/placeholder/400/400', 'knitwear');

-- Добавление примеров отзывов
INSERT INTO reviews (product_id, user_name, rating, comment) VALUES
(1, 'Анна К.', 5, 'Отличная куртка! Очень качественная, хорошо сидит. Рекомендую!'),
(1, 'Мария С.', 4, 'Красивая куртка, но немного маломерит. Берите на размер больше.'),
(2, 'Дмитрий П.', 5, 'Классические джинсы, ношу уже год - как новые. Отличное качество!'),
(2, 'Алексей В.', 4, 'Хорошие джинсы, но цена высоковата.'),
(3, 'Елена М.', 5, 'Очень красивое платье! Материал приятный, размер подошел идеально.'),
(4, 'Игорь Н.', 4, 'Качественная рубашка для офиса. Хорошо держит форму после стирки.'),
(5, 'София Л.', 5, 'Удобные кроссовки! Ношу каждый день, ноги не устают.'),
(6, 'Андрей Т.', 4, 'Теплый свитер, но немного колется. В целом хорошая покупка.');