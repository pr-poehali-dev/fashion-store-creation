import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface Review {
  id: number;
  productId: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  size: string[];
  description: string;
  rating?: number;
  reviewCount?: number;
}

interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
}

// URL бэкенд API для отзывов
const REVIEWS_API_URL = 'https://functions.poehali.dev/af93f244-5542-4621-b801-973a200d26bc';

const products: Product[] = [
  { id: 1, name: 'Уютный свитер', price: 3990, image: '/img/61f80bd2-7791-48b5-9e5c-fc2ff54f9ccf.jpg', category: 'Свитеры', size: ['S', 'M', 'L', 'XL'], description: 'Мягкий и теплый свитер из натурального хлопка', rating: 4.5, reviewCount: 12 },
  { id: 2, name: 'Комфортные джинсы', price: 4590, image: '/img/dd858c77-fcc3-4335-b012-1760f75889f5.jpg', category: 'Джинсы', size: ['28', '30', '32', '34'], description: 'Удобные джинсы с эластаном для максимального комфорта', rating: 4.7, reviewCount: 8 },
  { id: 3, name: 'Мягкая рубашка', price: 2890, image: '/img/61f80bd2-7791-48b5-9e5c-fc2ff54f9ccf.jpg', category: 'Рубашки', size: ['S', 'M', 'L'], description: 'Легкая рубашка из органического хлопка', rating: 4.8, reviewCount: 5 },
  { id: 4, name: 'Теплая кофта', price: 3290, image: '/img/dd858c77-fcc3-4335-b012-1760f75889f5.jpg', category: 'Кофты', size: ['S', 'M', 'L', 'XL'], description: 'Стильная кофта для повседневной носки', rating: 4.3, reviewCount: 7 },
];

function Index() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [productReviews, setProductReviews] = useState<Record<number, Review[]>>({});
  const [productStats, setProductStats] = useState<Record<number, {averageRating: number, totalReviews: number}>>({});

  const categories = ['Все', 'Свитеры', 'Джинсы', 'Рубашки', 'Кофты'];

  // Загрузка отзывов из API
  const loadReviews = async (productId: number) => {
    try {
      const response = await fetch(`${REVIEWS_API_URL}?product_id=${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProductReviews(prev => ({
          ...prev,
          [productId]: data.reviews || []
        }));
        setProductStats(prev => ({
          ...prev,
          [productId]: {
            averageRating: data.average_rating || 0,
            totalReviews: data.total_reviews || 0
          }
        }));
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  // Добавление нового отзыва
  const addReview = async (productId: number, userName: string, rating: number, comment: string) => {
    try {
      const response = await fetch(REVIEWS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          user_name: userName,
          rating: rating,
          comment: comment
        })
      });
      
      if (response.ok) {
        // Перезагружаем отзывы после добавления
        await loadReviews(productId);
      } else {
        console.error('Failed to add review');
      }
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };

  // Загрузка отзывов при первом открытии
  useEffect(() => {
    products.forEach(product => {
      loadReviews(product.id);
    });
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'Все' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product, selectedSize: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === selectedSize);
      if (existing) {
        return prev.map(item => 
          item.id === product.id && item.selectedSize === selectedSize 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedSize }];
    });
  };

  const removeFromCart = (id: number, size: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.selectedSize === size)));
  };

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };



  const ProductCard = ({ product }: { product: Product }) => {
    const [selectedSize, setSelectedSize] = useState<string>(product.size[0]);
    const [reviewName, setReviewName] = useState<string>('');
    const [reviewRating, setReviewRating] = useState<number>(5);
    const [reviewComment, setReviewComment] = useState<string>('');
    
    const handleSubmitReview = async () => {
      if (reviewName.trim() && reviewComment.trim()) {
        await addReview(product.id, reviewName.trim(), reviewRating, reviewComment.trim());
        setReviewName('');
        setReviewRating(5);
        setReviewComment('');
      }
    };
    
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 animate-fade-in">
        <div className="relative overflow-hidden rounded-t-lg">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-white/80 hover:bg-white"
            onClick={() => toggleFavorite(product.id)}
          >
            <Icon 
              name={favorites.includes(product.id) ? "Heart" : "Heart"} 
              size={20}
              className={favorites.includes(product.id) ? "fill-red-500 text-red-500" : ""}
            />
          </Button>
          <Badge className="absolute top-3 left-3 bg-terracotta-500">
            {product.category}
          </Badge>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-heading font-semibold text-lg mb-2">{product.name}</h3>
          <p className="text-muted-foreground text-sm mb-3">{product.description}</p>
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading font-bold text-xl text-primary">
              {product.price.toLocaleString()} ₽
            </span>
          </div>
          
          {/* Rating and Reviews */}
          {productStats[product.id] && productStats[product.id].totalReviews > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name="Star"
                    size={16}
                    className={star <= Math.round(productStats[product.id].averageRating) 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-muted-foreground"
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {productStats[product.id].averageRating.toFixed(1)} ({productStats[product.id].totalReviews} отзывов)
              </span>
            </div>
          )}
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Размер:</label>
              <div className="flex gap-2">
                {product.size.map(size => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                    className="min-w-[40px]"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 space-y-2">
          <Button 
            className="w-full font-medium"
            onClick={() => addToCart(product, selectedSize)}
          >
            <Icon name="ShoppingCart" size={18} className="mr-2" />
            Добавить в корзину
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full" 
                size="sm"
                onClick={() => loadReviews(product.id)}
              >
                <Icon name="MessageSquare" size={16} className="mr-2" />
                Отзывы ({productStats[product.id]?.totalReviews || 0})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Отзывы о товаре: {product.name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Add Review Form */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Написать отзыв</h4>
                  <div className="space-y-3">
                    <Input 
                      placeholder="Ваше имя" 
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                    />
                    <div>
                      <label className="text-sm font-medium mb-2 block">Оценка:</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Button
                            key={star}
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto"
                            onClick={() => setReviewRating(star)}
                          >
                            <Icon 
                              name="Star" 
                              size={20} 
                              className={star <= reviewRating 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-muted-foreground hover:text-yellow-400"
                              } 
                            />
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Textarea 
                      placeholder="Ваш отзыв о товаре" 
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                    />
                    <Button 
                      className="w-full" 
                      onClick={handleSubmitReview}
                      disabled={!reviewName.trim() || !reviewComment.trim()}
                    >
                      <Icon name="Send" size={16} className="mr-2" />
                      Отправить отзыв
                    </Button>
                  </div>
                </div>
                
                {/* Reviews List */}
                <div>
                  <h4 className="font-semibold mb-4">Отзывы покупателей</h4>
                  <div className="space-y-4">
                    {productReviews[product.id] && productReviews[product.id].length > 0 ? (
                      productReviews[product.id].map(review => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{review.userName}</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Icon
                                    key={star}
                                    name="Star"
                                    size={14}
                                    className={star <= review.rating 
                                      ? "fill-yellow-400 text-yellow-400" 
                                      : "text-muted-foreground"
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">{review.date}</span>
                          </div>
                          <p className="text-sm leading-relaxed">{review.comment}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Пока нет отзывов об этом товаре. Будьте первым!
                      </p>
                    )}
                    
                    {productReviews.filter(r => r.productId === product.id).length === 0 && (
                      <div className="text-center py-8">
                        <Icon name="MessageSquare" size={48} className="mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Пока нет отзывов об этом товаре</p>
                        <p className="text-sm text-muted-foreground">Будьте первым, кто оставит отзыв!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="font-heading font-bold text-2xl text-primary">Стиль & Комфорт</h1>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-foreground hover:text-primary transition-colors">Главная</a>
                <a href="#catalog" className="text-foreground hover:text-primary transition-colors">Каталог</a>
                <a href="#about" className="text-foreground hover:text-primary transition-colors">О нас</a>
                <a href="#contacts" className="text-foreground hover:text-primary transition-colors">Контакты</a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Icon name="Heart" size={20} />
                    {favorites.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                        {favorites.length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Избранное</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    {favorites.length === 0 ? (
                      <p className="text-muted-foreground">Пока нет избранных товаров</p>
                    ) : (
                      <div className="space-y-4">
                        {products.filter(p => favorites.includes(p.id)).map(product => (
                          <div key={product.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                            <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
                            <div className="flex-1">
                              <h4 className="font-medium">{product.name}</h4>
                              <p className="text-primary font-semibold">{product.price.toLocaleString()} ₽</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Icon name="ShoppingCart" size={20} />
                    {cart.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                        {cart.reduce((total, item) => total + item.quantity, 0)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Корзина</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    {cart.length === 0 ? (
                      <p className="text-muted-foreground">Корзина пуста</p>
                    ) : (
                      <>
                        <div className="space-y-4 mb-6">
                          {cart.map(item => (
                            <div key={`${item.id}-${item.selectedSize}`} className="flex items-center space-x-3 p-3 border rounded-lg">
                              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                              <div className="flex-1">
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-muted-foreground">Размер: {item.selectedSize}</p>
                                <p className="text-primary font-semibold">{item.price.toLocaleString()} ₽ × {item.quantity}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFromCart(item.id, item.selectedSize)}
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-heading font-bold text-lg">Итого:</span>
                            <span className="font-heading font-bold text-xl text-primary">
                              {getTotalPrice().toLocaleString()} ₽
                            </span>
                          </div>
                          <Button className="w-full" size="lg">
                            Оформить заказ
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Icon name="MessageCircle" size={20} />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Поддержка клиентов</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="font-medium mb-2">👋 Здравствуйте!</p>
                      <p className="text-sm text-muted-foreground">
                        Мы готовы помочь вам с выбором одежды, оформлением заказа и любыми вопросами. 
                        Напишите нам!
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Input placeholder="Ваше имя" />
                      <Input type="email" placeholder="Email" />
                      <Textarea placeholder="Ваш вопрос или сообщение" rows={4} />
                      <Button className="w-full">
                        <Icon name="Send" size={18} className="mr-2" />
                        Отправить сообщение
                      </Button>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">Или свяжитесь с нами:</p>
                      <div className="flex justify-center space-x-4">
                        <Button variant="outline" size="sm">
                          <Icon name="Phone" size={16} className="mr-2" />
                          +7 (495) 123-45-67
                        </Button>
                        <Button variant="outline" size="sm">
                          <Icon name="Mail" size={16} className="mr-2" />
                          info@style-comfort.ru
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/img/97882fc0-cc82-4c85-a8ff-e5a323660993.jpg" 
            alt="Hero" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative container mx-auto px-4 text-center text-white">
          <h2 className="font-heading font-bold text-5xl md:text-6xl mb-6 animate-fade-in">
            Стиль & Комфорт
          </h2>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto animate-fade-in">
            Одежда, которая дарит уверенность и комфорт каждый день
          </p>
          <Button size="lg" className="animate-scale-in">
            <Icon name="ArrowDown" size={20} className="mr-2" />
            Смотреть каталог
          </Button>
        </div>
      </section>

      {/* Catalog Section */}
      <section id="catalog" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-4xl mb-4">Наш каталог</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Качественная одежда для повседневной жизни. Выбирайте стиль, который отражает вас.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <Input
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Icon name="Search" size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading font-semibold text-xl mb-2">Товары не найдены</h3>
              <p className="text-muted-foreground">Попробуйте изменить параметры поиска</p>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading font-bold text-4xl mb-6">О нас</h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              «Стиль & Комфорт» — это магазин одежды, где каждая вещь выбирается с заботой о вашем комфорте и стиле. 
              Мы верим, что одежда должна не только красиво выглядеть, но и дарить ощущение уверенности и удобства.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Icon name="Shirt" size={32} className="text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">Качество</h3>
                <p className="text-muted-foreground">Только проверенные бренды и натуральные материалы</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Icon name="Heart" size={32} className="text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">Комфорт</h3>
                <p className="text-muted-foreground">Одежда, в которой вы чувствуете себя свободно</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Icon name="Sparkles" size={32} className="text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">Стиль</h3>
                <p className="text-muted-foreground">Современные тренды и классические решения</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contacts Section */}
      <section id="contacts" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading font-bold text-4xl text-center mb-12">Контакты</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 rounded-lg p-3">
                    <Icon name="MapPin" size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-1">Адрес</h3>
                    <p className="text-muted-foreground">г. Москва, ул. Примерная, д. 123<br />ТЦ "Стиль", 2 этаж</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 rounded-lg p-3">
                    <Icon name="Phone" size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-1">Телефон</h3>
                    <p className="text-muted-foreground">+7 (495) 123-45-67</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 rounded-lg p-3">
                    <Icon name="Mail" size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-1">Email</h3>
                    <p className="text-muted-foreground">info@style-comfort.ru</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 rounded-lg p-3">
                    <Icon name="Clock" size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-1">Режим работы</h3>
                    <p className="text-muted-foreground">Пн-Вс: 10:00 - 22:00</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="font-heading font-semibold text-xl mb-4">Напишите нам</h3>
                <div className="space-y-4">
                  <Input placeholder="Ваше имя" />
                  <Input type="email" placeholder="Email" />
                  <Input placeholder="Тема сообщения" />
                  <Textarea placeholder="Ваше сообщение" rows={4} />
                  <Button className="w-full">
                    <Icon name="Send" size={18} className="mr-2" />
                    Отправить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="font-heading font-bold text-2xl text-primary mb-4">Стиль & Комфорт</h3>
            <p className="text-muted-foreground mb-6">Одежда, которая дарит уверенность</p>
            <div className="flex justify-center space-x-6">
              <Button variant="ghost" size="icon">
                <Icon name="Instagram" size={20} />
              </Button>
              <Button variant="ghost" size="icon">
                <Icon name="Facebook" size={20} />
              </Button>
              <Button variant="ghost" size="icon">
                <Icon name="Twitter" size={20} />
              </Button>
            </div>
            <div className="mt-8 pt-8 border-t text-sm text-muted-foreground">
              © 2024 Стиль & Комфорт. Все права защищены.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Index;