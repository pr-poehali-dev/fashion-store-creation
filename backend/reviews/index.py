import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, List
from datetime import datetime

def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''
    Business: Управление отзывами товаров - получение и добавление отзывов
    Args: event - dict with httpMethod, body, queryStringParameters, pathParams
          context - object with attributes: request_id, function_name, function_version, memory_limit_in_mb
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # Database connection
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Database connection not configured'})
        }
    
    try:
        conn = psycopg2.connect(database_url)
        
        if method == 'GET':
            # Получение отзывов для товара
            params = event.get('queryStringParameters', {}) or {}
            product_id = params.get('product_id')
            
            if not product_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'product_id is required'})
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, user_name, rating, comment, 
                           TO_CHAR(created_at, 'DD.MM.YYYY') as date
                    FROM reviews 
                    WHERE product_id = %s 
                    ORDER BY created_at DESC
                """, (product_id,))
                
                reviews = [dict(row) for row in cur.fetchall()]
                
                # Вычисляем средний рейтинг
                if reviews:
                    avg_rating = sum(r['rating'] for r in reviews) / len(reviews)
                else:
                    avg_rating = 0
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'reviews': reviews,
                        'average_rating': round(avg_rating, 1),
                        'total_reviews': len(reviews)
                    })
                }
        
        elif method == 'POST':
            # Добавление нового отзыва
            body_data = json.loads(event.get('body', '{}'))
            
            product_id = body_data.get('product_id')
            user_name = body_data.get('user_name', '').strip()
            rating = body_data.get('rating')
            comment = body_data.get('comment', '').strip()
            
            # Валидация данных
            if not all([product_id, user_name, rating, comment]):
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'All fields are required'})
                }
            
            if not isinstance(rating, int) or rating < 1 or rating > 5:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Rating must be between 1 and 5'})
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    INSERT INTO reviews (product_id, user_name, rating, comment, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, TO_CHAR(created_at, 'DD.MM.YYYY') as date
                """, (product_id, user_name, rating, comment, datetime.now()))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'review_id': result['id'],
                        'date': result['date'],
                        'message': 'Review added successfully'
                    })
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except psycopg2.Error as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Database error: {str(e)}'})
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }
    
    finally:
        if 'conn' in locals():
            conn.close()