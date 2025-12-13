[pk-- ============================================================================
-- INSERT DEMO DATA - Dữ liệu demo đầy đủ cho hệ thống
-- Database: Agent_Db
-- ============================================================================

USE Agent_Db;

-- Xóa dữ liệu cũ (nếu có)
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM lessons WHERE course_id IN (SELECT id FROM courses WHERE created_by = 1);
DELETE FROM courses WHERE created_by = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- KHÓA HỌC 1: LẬP TRÌNH PYTHON
-- ============================================================================

INSERT INTO courses (title, description, created_by, is_public, created_at, updated_at) VALUES
('🐍 Lập Trình Python Từ Cơ Bản Đến Nâng Cao', 
 'Khóa học Python toàn diện cho người mới bắt đầu. Học cú pháp, OOP, xử lý file, và ứng dụng thực tế với hơn 50 bài tập thực hành.',
 1, TRUE, NOW(), NOW());

SET @python_course_id = LAST_INSERT_ID();

-- Bài học Python
INSERT INTO lessons (course_id, title, content, order_index, created_at) VALUES
(@python_course_id, 'Bài 1: Giới Thiệu Python và Cài Đặt Môi Trường', 
'# 🐍 Giới Thiệu Python

## Python là gì?
Python là ngôn ngữ lập trình bậc cao, dễ học và mạnh mẽ. Được tạo ra bởi **Guido van Rossum** năm 1991.

## 🎯 Tại sao học Python?
- ✅ **Cú pháp đơn giản**: Dễ đọc như tiếng Anh
- ✅ **Thư viện phong phú**: 200,000+ packages
- ✅ **Cộng đồng lớn**: 10+ triệu developers
- ✅ **Ứng dụng rộng rãi**: Web, AI, Data Science, Automation

## 📊 Python trong thực tế
- **Google**: Search engine, YouTube
- **Instagram**: Backend với Django
- **Netflix**: Recommendation system
- **NASA**: Data analysis

## 🚀 Cài đặt Python
1. Truy cập: https://www.python.org/downloads/
2. Download Python 3.11 hoặc mới hơn
3. Cài đặt và check "Add to PATH"
4. Verify: `python --version`

## 💻 Hello World
```python
# Chương trình Python đầu tiên
print("Hello, World!")
print("Chào mừng đến với Python!")

# Tính toán đơn giản
result = 10 + 20
print(f"10 + 20 = {result}")
```

## 🎯 Bài tập
1. Cài đặt Python trên máy của bạn
2. Viết chương trình in ra tên và tuổi của bạn
3. Tính tổng 2 số: 15 + 27
4. Tạo chương trình tính diện tích hình chữ nhật

## 📚 Tài liệu tham khảo
- [Python.org](https://www.python.org/)
- [Python Tutorial](https://docs.python.org/3/tutorial/)
- [Real Python](https://realpython.com/)',
1, NOW()),

(@python_course_id, 'Bài 2: Biến và Kiểu Dữ Liệu',
'# 📦 Biến và Kiểu Dữ Liệu

## Biến trong Python
Biến là nơi lưu trữ dữ liệu. Python không cần khai báo kiểu.

```python
# Khai báo biến
name = "Nguyễn Văn A"
age = 20
height = 1.75
is_student = True
```

## 🎨 Các kiểu dữ liệu cơ bản

### 1. Integer (int) - Số nguyên
```python
x = 100
y = -50
z = 0
```

### 2. Float - Số thực
```python
pi = 3.14159
temperature = 36.5
price = 99.99
```

### 3. String (str) - Chuỗi
```python
name = "Python"
message = ''Hello World''
multiline = \'\'\'
Đây là chuỗi
nhiều dòng
\'\'\'
```

### 4. Boolean (bool) - Logic
```python
is_active = True
is_admin = False
```

## 🔄 Ép kiểu (Type Casting)
```python
# String to Int
x = "123"
y = int(x)  # y = 123

# Int to String
age = 20
age_str = str(age)  # "20"

# String to Float
price = "99.99"
price_float = float(price)  # 99.99
```

## 📝 F-strings (Format Strings)
```python
name = "An"
age = 20
print(f"Tên: {name}, Tuổi: {age}")
print(f"Sau 5 năm: {age + 5} tuổi")
```

## 🎯 Bài tập
1. Tạo biến lưu: tên, tuổi, chiều cao, điểm trung bình
2. In ra thông tin với f-string
3. Tính tuổi sau 10 năm
4. Chuyển đổi string "3.14" thành float',
2, NOW()),

(@python_course_id, 'Bài 3: Cấu Trúc Điều Kiện If-Else',
'# 🔀 Cấu Trúc Điều Kiện

## If Statement
```python
age = 18
if age >= 18:
    print("Bạn đã trưởng thành")
```

## If-Else
```python
age = 16
if age >= 18:
    print("Bạn đã trưởng thành")
else:
    print("Bạn chưa trưởng thành")
```

## If-Elif-Else
```python
score = 85

if score >= 90:
    grade = "Xuất sắc"
elif score >= 80:
    grade = "Giỏi"
elif score >= 70:
    grade = "Khá"
elif score >= 60:
    grade = "Trung bình"
else:
    grade = "Yếu"

print(f"Xếp loại: {grade}")
```

## Nested If (If lồng nhau)
```python
age = 20
has_license = True

if age >= 18:
    if has_license:
        print("Bạn có thể lái xe")
    else:
        print("Bạn cần có bằng lái")
else:
    print("Bạn chưa đủ tuổi")
```

## Ternary Operator (Toán tử 3 ngôi)
```python
age = 20
status = "Adult" if age >= 18 else "Minor"
print(status)  # Adult
```

## 🎯 Bài tập
1. Viết chương trình kiểm tra số dương/âm/zero
2. Xếp loại học lực theo điểm (0-100)
3. Kiểm tra năm nhuận
4. Tính tiền điện theo bậc thang',
3, NOW()),

(@python_course_id, 'Bài 4: Vòng Lặp For và While',
'# 🔁 Vòng Lặp

## Vòng lặp For
```python
# Lặp qua range
for i in range(5):
    print(i)  # 0, 1, 2, 3, 4

# Range với start và stop
for i in range(1, 6):
    print(i)  # 1, 2, 3, 4, 5

# Range với step
for i in range(0, 10, 2):
    print(i)  # 0, 2, 4, 6, 8
```

## Lặp qua List
```python
fruits = ["apple", "banana", "orange"]
for fruit in fruits:
    print(fruit)
```

## Vòng lặp While
```python
count = 0
while count < 5:
    print(count)
    count += 1
```

## Break và Continue
```python
# Break - Dừng vòng lặp
for i in range(10):
    if i == 5:
        break
    print(i)  # 0, 1, 2, 3, 4

# Continue - Bỏ qua lần lặp
for i in range(5):
    if i == 2:
        continue
    print(i)  # 0, 1, 3, 4
```

## Nested Loops (Vòng lặp lồng)
```python
# In bảng cửu chương
for i in range(1, 10):
    for j in range(1, 10):
        print(f"{i} x {j} = {i*j}")
    print()  # Xuống dòng
```

## 🎯 Bài tập
1. In bảng cửu chương 7
2. Tính tổng từ 1 đến 100
3. Tìm số nguyên tố từ 1 đến 50
4. In hình tam giác sao',
4, NOW()),

(@python_course_id, 'Bài 5: List, Tuple và Dictionary',
'# 📚 List, Tuple và Dictionary

## List (Danh sách)
```python
numbers = [1, 2, 3, 4, 5]
numbers.append(6)  # Thêm phần tử
numbers.remove(3)  # Xóa phần tử
print(numbers[0])  # Truy cập phần tử đầu
```

## List Methods
```python
fruits = ["apple", "banana", "orange"]

# Thêm
fruits.append("grape")        # Thêm cuối
fruits.insert(1, "mango")     # Thêm vào vị trí

# Xóa
fruits.remove("banana")       # Xóa theo giá trị
fruits.pop()                  # Xóa cuối
fruits.pop(0)                 # Xóa theo index

# Sắp xếp
numbers = [3, 1, 4, 1, 5]
numbers.sort()                # Sắp xếp tăng dần
numbers.reverse()             # Đảo ngược
```

## Tuple (Bất biến)
```python
coordinates = (10, 20)
x, y = coordinates  # Unpacking

# Tuple không thể thay đổi
# coordinates[0] = 15  # ERROR!
```

## Dictionary (Từ điển)
```python
student = {
    "name": "An",
    "age": 20,
    "grade": "A"
}

# Truy cập
print(student["name"])        # An
print(student.get("age"))     # 20

# Thêm/Sửa
student["email"] = "an@example.com"
student["age"] = 21

# Xóa
del student["grade"]
```

## List Comprehension
```python
# Tạo list số chính phương
squares = [x**2 for x in range(10)]

# Lọc số chẵn
evens = [x for x in range(20) if x % 2 == 0]

# Với điều kiện
result = [x if x > 0 else 0 for x in [-1, 2, -3, 4]]
```

## 🎯 Bài tập
1. Tạo list 10 số và tính trung bình
2. Lọc số chẵn từ list
3. Đảo ngược list không dùng reverse()
4. Tạo dictionary lưu thông tin sinh viên
5. Đếm số lần xuất hiện của mỗi phần tử',
5, NOW());


-- ============================================================================
-- KHÓA HỌC 2: JAVA SPRING BOOT
-- ============================================================================

INSERT INTO courses (title, description, created_by, is_public, created_at, updated_at) VALUES
('☕ Java Spring Boot - Xây Dựng REST API', 
 'Học Spring Boot từ cơ bản đến nâng cao. Xây dựng RESTful API, JWT Authentication, Database Integration với MySQL.',
 1, TRUE, NOW(), NOW());

SET @java_course_id = LAST_INSERT_ID();

INSERT INTO lessons (course_id, title, content, order_index, created_at) VALUES
(@java_course_id, 'Bài 1: Giới Thiệu Spring Boot Framework',
'# ☕ Spring Boot Framework

## Spring Boot là gì?
Spring Boot là framework Java giúp xây dựng ứng dụng production-ready nhanh chóng với cấu hình tối thiểu.

## 🎯 Ưu điểm
- ✅ **Auto-configuration**: Tự động cấu hình
- ✅ **Embedded Server**: Tomcat/Jetty built-in
- ✅ **Production-ready**: Metrics, health checks
- ✅ **Microservices**: Dễ dàng xây dựng microservices

## 📦 Cài đặt
1. **JDK 17** trở lên
2. **Maven** hoặc **Gradle**
3. **IDE**: IntelliJ IDEA (recommended) hoặc Eclipse

## 🚀 Tạo project
```bash
# Spring Initializr
https://start.spring.io/

Dependencies:
- Spring Web
- Spring Data JPA
- MySQL Driver
- Lombok
- Spring Security
```

## 💻 Hello World Controller
```java
@RestController
public class HelloController {
    
    @GetMapping("/hello")
    public String hello() {
        return "Hello, Spring Boot!";
    }
    
    @GetMapping("/api/info")
    public Map<String, String> getInfo() {
        Map<String, String> info = new HashMap<>();
        info.put("name", "My API");
        info.put("version", "1.0.0");
        return info;
    }
}
```

## 📁 Project Structure
```
src/
├── main/
│   ├── java/
│   │   └── com.example.demo/
│   │       ├── DemoApplication.java
│   │       ├── controller/
│   │       ├── service/
│   │       ├── repository/
│   │       └── entity/
│   └── resources/
│       ├── application.properties
│       └── static/
└── test/
```

## 🎯 Bài tập
1. Tạo Spring Boot project với Spring Initializr
2. Tạo REST endpoint trả về thông tin cá nhân
3. Run application và test với browser',
1, NOW()),

(@java_course_id, 'Bài 2: REST API và CRUD Operations',
'# 🌐 REST API với Spring Boot

## @RestController
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    // GET - Lấy tất cả users
    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();
    }
    
    // GET - Lấy user theo ID
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.findById(id);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }
    
    // POST - Tạo user mới
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User created = userService.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    // PUT - Cập nhật user
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(
        @PathVariable Long id, 
        @RequestBody User user
    ) {
        User updated = userService.update(id, user);
        return ResponseEntity.ok(updated);
    }
    
    // DELETE - Xóa user
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

## HTTP Methods
- **GET**: Lấy dữ liệu (Read)
- **POST**: Tạo mới (Create)
- **PUT**: Cập nhật (Update)
- **DELETE**: Xóa (Delete)

## Status Codes
- **200 OK**: Thành công
- **201 Created**: Tạo mới thành công
- **400 Bad Request**: Request không hợp lệ
- **404 Not Found**: Không tìm thấy
- **500 Internal Server Error**: Lỗi server

## 🎯 Bài tập
1. Tạo Product API với CRUD
2. Thêm validation cho request body
3. Test API với Postman',
2, NOW()),

(@java_course_id, 'Bài 3: JPA và Database Integration',
'# 🗄️ Spring Data JPA

## Entity Class
```java
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String username;
    
    @Column(nullable = false)
    private String password;
    
    @Column(unique = true)
    private String email;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
}
```

## Repository Interface
```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    List<User> findByEmailContaining(String email);
    
    @Query("SELECT u FROM User u WHERE u.age > :age")
    List<User> findUsersOlderThan(@Param("age") int age);
}
```

## Service Layer
```java
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    
    public List<User> findAll() {
        return userRepository.findAll();
    }
    
    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
    
    public User save(User user) {
        return userRepository.save(user);
    }
    
    public void delete(Long id) {
        userRepository.deleteById(id);
    }
}
```

## application.properties
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/mydb
spring.datasource.username=root
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

## 🎯 Bài tập
1. Tạo Product entity với JPA
2. Implement CRUD repository
3. Test với MySQL database',
3, NOW());


-- ============================================================================
-- KHÓA HỌC 3: REACT
-- ============================================================================

INSERT INTO courses (title, description, created_by, is_public, created_at, updated_at) VALUES
('⚛️ React - Xây Dựng Giao Diện Web Hiện Đại', 
 'Học React từ cơ bản: Components, Hooks, State Management, Router, và tích hợp API backend.',
 1, TRUE, NOW(), NOW());

SET @react_course_id = LAST_INSERT_ID();

INSERT INTO lessons (course_id, title, content, order_index, created_at) VALUES
(@react_course_id, 'Bài 1: Giới Thiệu React và JSX',
'# ⚛️ React Framework

## React là gì?
React là thư viện JavaScript để xây dựng giao diện người dùng (UI). Được phát triển bởi Facebook.

## 🎯 Đặc điểm
- ✅ **Component-based**: Chia nhỏ UI thành components
- ✅ **Virtual DOM**: Render nhanh và hiệu quả
- ✅ **Declarative**: Code dễ đọc, dễ debug
- ✅ **Reusable**: Components có thể tái sử dụng

## 📦 Cài đặt
```bash
# Tạo React app
npx create-react-app my-app
cd my-app
npm start
```

## 💻 JSX Syntax
```jsx
function Welcome() {
    const name = "React";
    const version = "18.0";
    
    return (
        <div className="welcome">
            <h1>Hello, {name}!</h1>
            <p>Version: {version}</p>
            <button onClick={() => alert(''Clicked!'')}>
                Click me
            </button>
        </div>
    );
}
```

## 🧩 Component
```jsx
// Functional Component
function Button({ text, onClick }) {
    return (
        <button 
            className="btn btn-primary"
            onClick={onClick}
        >
            {text}
        </button>
    );
}

// Usage
<Button text="Submit" onClick={handleSubmit} />
```

## Props
```jsx
function Greeting({ name, age }) {
    return (
        <div>
            <h1>Hello {name}!</h1>
            <p>You are {age} years old</p>
        </div>
    );
}

// Usage
<Greeting name="John" age={25} />
```

## 🎯 Bài tập
1. Tạo React app mới
2. Tạo component Card hiển thị thông tin
3. Tạo component Button với props
4. Tạo component List hiển thị danh sách',
1, NOW()),

(@react_course_id, 'Bài 2: State và Hooks',
'# 🎣 State và Hooks

## useState Hook
```jsx
import { useState } from ''react'';

function Counter() {
    const [count, setCount] = useState(0);
    
    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Increment
            </button>
            <button onClick={() => setCount(count - 1)}>
                Decrement
            </button>
            <button onClick={() => setCount(0)}>
                Reset
            </button>
        </div>
    );
}
```

## Multiple States
```jsx
function Form() {
    const [name, setName] = useState('''');
    const [email, setEmail] = useState('''');
    const [age, setAge] = useState(0);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({ name, email, age });
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
            />
            <input 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
            />
            <input 
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age"
            />
            <button type="submit">Submit</button>
        </form>
    );
}
```

## useEffect Hook
```jsx
import { useState, useEffect } from ''react'';

function Timer() {
    const [seconds, setSeconds] = useState(0);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);
        
        // Cleanup
        return () => clearInterval(interval);
    }, []); // Empty array = run once
    
    return <p>Seconds: {seconds}</p>;
}
```

## Fetch Data
```jsx
function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetch(''https://api.example.com/users'')
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                setLoading(false);
            });
    }, []);
    
    if (loading) return <p>Loading...</p>;
    
    return (
        <ul>
            {users.map(user => (
                <li key={user.id}>{user.name}</li>
            ))}
        </ul>
    );
}
```

## 🎯 Bài tập
1. Tạo Todo List với useState
2. Tạo Form đăng ký với validation
3. Fetch data từ API và hiển thị
4. Tạo Timer đếm ngược',
2, NOW()),

(@react_course_id, 'Bài 3: React Router và Navigation',
'# 🧭 React Router

## Cài đặt
```bash
npm install react-router-dom
```

## Basic Routing
```jsx
import { BrowserRouter, Routes, Route, Link } from ''react-router-dom'';

function App() {
    return (
        <BrowserRouter>
            <nav>
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                <Link to="/contact">Contact</Link>
            </nav>
            
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
            </Routes>
        </BrowserRouter>
    );
}
```

## Dynamic Routes
```jsx
<Routes>
    <Route path="/users/:id" element={<UserDetail />} />
    <Route path="/products/:id" element={<ProductDetail />} />
</Routes>

// Component
import { useParams } from ''react-router-dom'';

function UserDetail() {
    const { id } = useParams();
    return <h1>User ID: {id}</h1>;
}
```

## Programmatic Navigation
```jsx
import { useNavigate } from ''react-router-dom'';

function LoginForm() {
    const navigate = useNavigate();
    
    const handleLogin = () => {
        // Login logic...
        navigate(''/dashboard'');
    };
    
    return <button onClick={handleLogin}>Login</button>;
}
```

## Protected Routes
```jsx
function ProtectedRoute({ children }) {
    const isAuthenticated = checkAuth();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }
    
    return children;
}

// Usage
<Route 
    path="/dashboard" 
    element={
        <ProtectedRoute>
            <Dashboard />
        </ProtectedRoute>
    } 
/>
```

## 🎯 Bài tập
1. Tạo multi-page app với Router
2. Implement dynamic routes
3. Tạo protected routes
4. Add 404 page',
3, NOW());


-- ============================================================================
-- KHÓA HỌC 4: MACHINE LEARNING
-- ============================================================================

INSERT INTO courses (title, description, created_by, is_public, created_at, updated_at) VALUES
('🤖 Machine Learning với Python', 
 'Khóa học Machine Learning cơ bản: Supervised Learning, Neural Networks, và ứng dụng thực tế với Scikit-learn.',
 1, TRUE, NOW(), NOW());

SET @ml_course_id = LAST_INSERT_ID();

INSERT INTO lessons (course_id, title, content, order_index, created_at) VALUES
(@ml_course_id, 'Bài 1: Giới Thiệu Machine Learning',
'# 🤖 Machine Learning

## ML là gì?
Machine Learning là nhánh của AI cho phép máy tính học từ dữ liệu mà không cần lập trình cụ thể.

## 🎯 Các loại ML
1. **Supervised Learning**: Học có giám sát (có label)
   - Classification: Phân loại
   - Regression: Dự đoán giá trị

2. **Unsupervised Learning**: Học không giám sát
   - Clustering: Phân cụm
   - Dimensionality Reduction: Giảm chiều

3. **Reinforcement Learning**: Học tăng cường
   - Agent học từ reward/punishment

## 📚 Thư viện phổ biến
- **NumPy**: Tính toán số học
- **Pandas**: Xử lý dữ liệu
- **Scikit-learn**: ML algorithms
- **TensorFlow/PyTorch**: Deep Learning
- **Matplotlib**: Visualization

## 📦 Cài đặt
```bash
pip install numpy pandas scikit-learn matplotlib seaborn
```

## 💻 Hello ML
```python
from sklearn.linear_model import LinearRegression
import numpy as np

# Data
X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 6, 8, 10])

# Train
model = LinearRegression()
model.fit(X, y)

# Predict
prediction = model.predict([[6]])
print(f"Prediction: {prediction}")  # [12]
```

## 🎯 Bài tập
1. Cài đặt các thư viện ML
2. Tạo dataset đơn giản
3. Train model Linear Regression
4. Visualize kết quả',
1, NOW()),

(@ml_course_id, 'Bài 2: Linear Regression',
'# 📈 Linear Regression

## Công thức
y = mx + b

Trong đó:
- **y**: Giá trị dự đoán
- **m**: Hệ số góc (slope)
- **x**: Đầu vào (feature)
- **b**: Hệ số chặn (intercept)

## Ví dụ: Dự đoán giá nhà
```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
import matplotlib.pyplot as plt

# Load data
data = pd.DataFrame({
    ''area'': [50, 60, 70, 80, 90, 100, 110, 120],
    ''price'': [150, 180, 210, 240, 270, 300, 330, 360]
})

# Split features and target
X = data[[''area'']]
y = data[''price'']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = LinearRegression()
model.fit(X_train, y_train)

# Predict
y_pred = model.predict(X_test)

# Evaluate
print(f"R² Score: {r2_score(y_test, y_pred):.3f}")
print(f"MSE: {mean_squared_error(y_test, y_pred):.3f}")
print(f"Slope: {model.coef_[0]:.2f}")
print(f"Intercept: {model.intercept_:.2f}")
```

## Visualization
```python
plt.scatter(X, y, color=''blue'', label=''Actual'')
plt.plot(X, model.predict(X), color=''red'', label=''Predicted'')
plt.xlabel(''Area (m²)'')
plt.ylabel(''Price (million VND)'')
plt.legend()
plt.show()
```

## Multiple Linear Regression
```python
# Multiple features
X = data[[''area'', ''bedrooms'', ''age'']]
y = data[''price'']

model = LinearRegression()
model.fit(X, y)

# Predict
new_house = [[100, 3, 5]]  # 100m², 3 bedrooms, 5 years old
price = model.predict(new_house)
```

## 🎯 Bài tập
1. Tạo dataset giá nhà với nhiều features
2. Train Linear Regression model
3. Evaluate với R² và MSE
4. Visualize kết quả',
2, NOW()),

(@ml_course_id, 'Bài 3: Classification với Decision Tree',
'# 🌳 Classification

## Decision Tree Classifier
```python
from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

# Load Iris dataset
iris = load_iris()
X = iris.data
y = iris.target

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# Train
clf = DecisionTreeClassifier(max_depth=3, random_state=42)
clf.fit(X_train, y_train)

# Predict
y_pred = clf.predict(X_test)

# Evaluate
print(f"Accuracy: {accuracy_score(y_test, y_pred):.3f}")
print("\\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=iris.target_names))
```

## Confusion Matrix
```python
cm = confusion_matrix(y_test, y_pred)

plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt=''d'', cmap=''Blues'')
plt.xlabel(''Predicted'')
plt.ylabel(''Actual'')
plt.title(''Confusion Matrix'')
plt.show()
```

## Feature Importance
```python
import pandas as pd

feature_importance = pd.DataFrame({
    ''feature'': iris.feature_names,
    ''importance'': clf.feature_importances_
}).sort_values(''importance'', ascending=False)

print(feature_importance)
```

## Cross-Validation
```python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(clf, X, y, cv=5)
print(f"Cross-validation scores: {scores}")
print(f"Mean accuracy: {scores.mean():.3f} (+/- {scores.std():.3f})")
```

## 🎯 Bài tập
1. Train Decision Tree với Iris dataset
2. Visualize confusion matrix
3. Analyze feature importance
4. Compare với Random Forest',
3, NOW());


-- ============================================================================
-- KHÓA HỌC 5: SQL VÀ DATABASE
-- ============================================================================

INSERT INTO courses (title, description, created_by, is_public, created_at, updated_at) VALUES
('🗄️ SQL và Database Design', 
 'Học SQL từ cơ bản đến nâng cao: Query, Join, Index, Stored Procedures, và thiết kế database chuyên nghiệp.',
 1, TRUE, NOW(), NOW());

SET @sql_course_id = LAST_INSERT_ID();

INSERT INTO lessons (course_id, title, content, order_index, created_at) VALUES
(@sql_course_id, 'Bài 1: SQL Cơ Bản - SELECT và WHERE',
'# 📊 SQL Basics

## SELECT Statement
```sql
-- Lấy tất cả columns
SELECT * FROM users;

-- Lấy columns cụ thể
SELECT username, email FROM users;

-- Lấy với điều kiện
SELECT * FROM users WHERE age > 18;

-- Sắp xếp
SELECT * FROM users ORDER BY created_at DESC;

-- Giới hạn kết quả
SELECT * FROM users LIMIT 10;

-- DISTINCT (loại bỏ trùng)
SELECT DISTINCT country FROM users;
```

## WHERE Clause
```sql
-- So sánh
SELECT * FROM products WHERE price > 100;
SELECT * FROM products WHERE price BETWEEN 50 AND 100;

-- LIKE (tìm kiếm)
SELECT * FROM users WHERE email LIKE ''%@gmail.com'';
SELECT * FROM users WHERE name LIKE ''Nguyen%'';

-- IN (trong danh sách)
SELECT * FROM orders WHERE status IN (''pending'', ''processing'');

-- IS NULL / IS NOT NULL
SELECT * FROM users WHERE phone IS NULL;

-- AND, OR, NOT
SELECT * FROM users 
WHERE age > 18 AND country = ''Vietnam'';

SELECT * FROM products 
WHERE category = ''Electronics'' OR category = ''Books'';
```

## Aggregate Functions
```sql
-- COUNT
SELECT COUNT(*) FROM users;
SELECT COUNT(DISTINCT country) FROM users;

-- SUM
SELECT SUM(price) FROM orders;
SELECT SUM(quantity * price) AS total FROM order_items;

-- AVG
SELECT AVG(score) FROM students;

-- MAX, MIN
SELECT MAX(salary), MIN(salary) FROM employees;

-- GROUP BY
SELECT country, COUNT(*) as user_count
FROM users
GROUP BY country
ORDER BY user_count DESC;

-- HAVING (filter sau GROUP BY)
SELECT category, AVG(price) as avg_price
FROM products
GROUP BY category
HAVING AVG(price) > 100;
```

## 🎯 Bài tập
1. Lấy 10 users mới nhất
2. Đếm số users theo quốc gia
3. Tính tổng doanh thu theo tháng
4. Tìm sản phẩm có giá cao nhất',
1, NOW()),

(@sql_course_id, 'Bài 2: JOIN và Relationships',
'# 🔗 SQL JOINs

## INNER JOIN
```sql
-- Lấy users và orders của họ
SELECT users.username, orders.total, orders.created_at
FROM users
INNER JOIN orders ON users.id = orders.user_id;

-- Với alias
SELECT u.username, o.total, o.created_at
FROM users u
INNER JOIN orders o ON u.id = o.user_id;
```

## LEFT JOIN
```sql
-- Lấy tất cả users, kể cả không có orders
SELECT u.username, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username;
```

## RIGHT JOIN
```sql
-- Lấy tất cả orders, kể cả user đã bị xóa
SELECT o.id, o.total, u.username
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;
```

## Multiple JOINs
```sql
SELECT 
    u.username,
    o.id AS order_id,
    p.name AS product_name,
    oi.quantity,
    oi.price
FROM users u
INNER JOIN orders o ON u.id = o.user_id
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
WHERE o.created_at >= ''2024-01-01'';
```

## Subquery
```sql
-- Users có tổng đơn hàng > 1000
SELECT * FROM users
WHERE id IN (
    SELECT user_id FROM orders
    GROUP BY user_id
    HAVING SUM(total) > 1000
);

-- Sản phẩm có giá cao hơn trung bình
SELECT * FROM products
WHERE price > (SELECT AVG(price) FROM products);
```

## UNION
```sql
-- Kết hợp 2 queries
SELECT name, ''Customer'' as type FROM customers
UNION
SELECT name, ''Supplier'' as type FROM suppliers;
```

## 🎯 Bài tập
1. JOIN users với orders và tính tổng chi tiêu
2. Tìm users chưa có đơn hàng nào
3. Lấy top 10 sản phẩm bán chạy nhất
4. Tính doanh thu theo category',
2, NOW()),

(@sql_course_id, 'Bài 3: Database Design và Optimization',
'# 🏗️ Database Design

## Primary Key và Foreign Key
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    total DECIMAL(10, 2),
    status ENUM(''pending'', ''completed'', ''cancelled''),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Indexes
```sql
-- Tạo index
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_email ON users(email);

-- Composite index
CREATE INDEX idx_user_date ON orders(user_id, created_at);

-- Unique index
CREATE UNIQUE INDEX idx_unique_email ON users(email);

-- Xem indexes
SHOW INDEX FROM users;

-- Xóa index
DROP INDEX idx_username ON users;
```

## Normalization
**1NF (First Normal Form)**
- Mỗi cell chứa giá trị đơn
- Không có repeating groups

**2NF (Second Normal Form)**
- Đạt 1NF
- Không có partial dependency

**3NF (Third Normal Form)**
- Đạt 2NF
- Không có transitive dependency

## Transactions
```sql
START TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

COMMIT;  -- Hoặc ROLLBACK nếu có lỗi
```

## Stored Procedures
```sql
DELIMITER //

CREATE PROCEDURE GetUserOrders(IN userId BIGINT)
BEGIN
    SELECT * FROM orders WHERE user_id = userId;
END //

DELIMITER ;

-- Call procedure
CALL GetUserOrders(1);
```

## Views
```sql
CREATE VIEW user_order_summary AS
SELECT 
    u.id,
    u.username,
    COUNT(o.id) as order_count,
    SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username;

-- Use view
SELECT * FROM user_order_summary WHERE total_spent > 1000;
```

## 🎯 Bài tập
1. Thiết kế database cho e-commerce
2. Tạo indexes cho performance
3. Normalize database đến 3NF
4. Tạo stored procedure tính doanh thu',
3, NOW());


-- ============================================================================
-- KHÓA HỌC 6: UI/UX DESIGN
-- ============================================================================

INSERT INTO courses (title, description, created_by, is_public, created_at, updated_at) VALUES
('🎨 UI/UX Design Fundamentals', 
 'Học thiết kế giao diện và trải nghiệm người dùng: Color Theory, Typography, Layout, Prototyping với Figma.',
 1, TRUE, NOW(), NOW());

SET @design_course_id = LAST_INSERT_ID();

INSERT INTO lessons (course_id, title, content, order_index, created_at) VALUES
(@design_course_id, 'Bài 1: Nguyên Tắc Thiết Kế UI/UX',
'# 🎨 UI/UX Design Principles

## UI vs UX
- **UI (User Interface)**: Giao diện - màu sắc, font, layout, buttons
- **UX (User Experience)**: Trải nghiệm - flow, usability, accessibility, satisfaction

## 🎯 10 Nguyên Tắc Vàng (Nielsen''s Heuristics)

### 1. Visibility of System Status
Hệ thống luôn thông báo cho user biết đang xảy ra gì
- Loading indicators
- Progress bars
- Success/Error messages

### 2. Match Between System and Real World
Sử dụng ngôn ngữ người dùng hiểu
- Tránh technical jargon
- Icons quen thuộc
- Metaphors từ thế giới thực

### 3. User Control and Freedom
Cho phép user undo/redo
- Back button
- Cancel button
- Undo/Redo actions

### 4. Consistency and Standards
Nhất quán trong toàn bộ app
- Màu sắc consistent
- Button styles giống nhau
- Navigation pattern đồng nhất

### 5. Error Prevention
Ngăn lỗi tốt hơn là báo lỗi
- Confirmation dialogs
- Input validation
- Disable invalid actions

## 🎨 Color Theory

### Primary Colors
- **Red**: Passion, urgency, danger
- **Blue**: Trust, calm, professional
- **Yellow**: Optimism, attention, warning

### Color Schemes
- **Complementary**: Màu đối diện (Red-Green)
- **Analogous**: Màu kề nhau (Blue-Green-Cyan)
- **Triadic**: 3 màu cách đều (Red-Yellow-Blue)

### 60-30-10 Rule
- **60%**: Dominant color (background)
- **30%**: Secondary color (content)
- **10%**: Accent color (CTA, highlights)

## ✍️ Typography

### Font Hierarchy
```
H1: 32-48px (Titles)
H2: 24-32px (Sections)
H3: 18-24px (Subsections)
Body: 14-16px (Content)
Small: 12-14px (Captions)
```

### Font Pairing
- **Serif + Sans-serif**: Classic combination
- **Max 2-3 fonts**: Tránh quá nhiều fonts
- **Contrast**: Bold vs Light, Large vs Small

### Readability
- **Line height**: 1.5-1.8
- **Line length**: 50-75 characters
- **Contrast**: 4.5:1 minimum (WCAG)

## 📐 Layout Principles

### Grid System
- **12-column grid**: Flexible, responsive
- **8px grid**: Consistent spacing
- **Golden ratio**: 1.618

### White Space
- Breathing room cho content
- Tăng readability
- Highlight important elements

### Visual Hierarchy
1. **Size**: Lớn = quan trọng
2. **Color**: Bright = attention
3. **Position**: Top-left = first seen
4. **Contrast**: High = stand out

## 🎯 Bài tập
1. Phân tích UI của 3 apps yêu thích
2. Tạo color palette cho project
3. Design button với 3 states (normal, hover, active)
4. Tạo typography scale',
1, NOW()),

(@design_course_id, 'Bài 2: Wireframing và Prototyping',
'# 📱 Wireframing và Prototyping

## Wireframe là gì?
Wireframe là bản phác thảo low-fidelity của giao diện, tập trung vào:
- Layout structure
- Content placement
- User flow
- Functionality

## 🎨 Levels of Fidelity

### Low-Fidelity
- Sketches, paper prototypes
- Black & white
- Basic shapes
- **Use case**: Brainstorming, early concepts

### Mid-Fidelity
- Digital wireframes
- Grayscale
- More details
- **Use case**: User testing, stakeholder review

### High-Fidelity
- Full design
- Colors, images, fonts
- Interactive
- **Use case**: Developer handoff, final approval

## 🛠️ Tools

### Figma (Recommended)
```
✅ Free tier generous
✅ Browser-based
✅ Real-time collaboration
✅ Component system
✅ Prototyping built-in
```

### Adobe XD
```
✅ Adobe ecosystem
✅ Powerful prototyping
✅ Voice prototyping
```

### Sketch
```
✅ Mac only
✅ Plugin ecosystem
✅ Industry standard
```

## 📐 Wireframe Best Practices

### 1. Start with User Flow
```
Login → Dashboard → Feature → Result
```

### 2. Focus on Content
- What information is needed?
- What actions can user take?
- What is the priority?

### 3. Use Real Content
- Avoid Lorem Ipsum
- Use actual text lengths
- Real images sizes

### 4. Annotations
- Explain interactions
- Note edge cases
- Document states

## 🎭 Prototyping

### Interactive Elements
- **Buttons**: Click to navigate
- **Forms**: Input validation
- **Modals**: Open/close
- **Tabs**: Switch content

### Transitions
- **Fade**: Smooth, subtle
- **Slide**: Directional, spatial
- **Scale**: Zoom in/out
- **Dissolve**: Content change

### Micro-interactions
- **Button hover**: Color change
- **Input focus**: Border highlight
- **Loading**: Spinner animation
- **Success**: Checkmark animation

## 🧪 User Testing

### Prepare
1. Define goals
2. Create scenarios
3. Recruit participants
4. Prepare questions

### Conduct
1. Explain purpose
2. Give tasks
3. Observe (don''t help!)
4. Ask follow-up questions

### Analyze
1. Identify patterns
2. Prioritize issues
3. Iterate design
4. Test again

## 🎯 Bài tập
1. Sketch wireframe cho mobile app
2. Tạo prototype trong Figma
3. Add interactions và transitions
4. Conduct user testing với 3 người',
2, NOW());


-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Đếm số lượng đã insert
SELECT 
    'Courses' as Type,
    COUNT(*) as Count
FROM courses
WHERE created_by = 1

UNION ALL

SELECT 
    'Lessons' as Type,
    COUNT(*) as Count
FROM lessons
WHERE course_id IN (SELECT id FROM courses WHERE created_by = 1);

-- Xem chi tiết
SELECT 
    c.id,
    c.title as course_title,
    COUNT(l.id) as lesson_count
FROM courses c
LEFT JOIN lessons l ON c.id = l.course_id
WHERE c.created_by = 1
GROUP BY c.id, c.title
ORDER BY c.id;

-- ============================================================================
-- DONE! 🎉
-- ============================================================================
-- Đã tạo:
-- - 6 khóa học
-- - 17 bài học với nội dung đầy đủ
-- 
-- Để chạy file này:
-- mysql -u root -p Agent_Db < insert_demo_data.sql
-- 
-- Hoặc trong MySQL Workbench:
-- File → Open SQL Script → Chọn file này → Execute
-- ============================================================================
