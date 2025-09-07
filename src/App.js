import { useState, useEffect } from 'react';
import './App.css';

// 提供时间数据（支持时区）
function provideTime(timezoneOffset = 8) {
  const now = new Date();
  // 应用时区偏移
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const localTime = new Date(utc + (3600000 * timezoneOffset));
  
  const hours = localTime.getHours();
  const minutes = localTime.getMinutes();
  const seconds = localTime.getSeconds();
  const hours1 = Math.floor(hours / 10);
  const hours2 = hours % 10;
  const minutes1 = Math.floor(minutes / 10);
  const minutes2 = minutes % 10;
  const seconds1 = Math.floor(seconds / 10);
  const seconds2 = seconds % 10;

  return [hours1, hours2, minutes1, minutes2, seconds1, seconds2];
}

// 获取指定时区的当前时间
const getCurrentTimeForCity = (timezoneOffset) => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const cityTime = new Date(utc + (3600000 * timezoneOffset));
  return cityTime.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

// 获取国家旗帜符号
const getCountryFlag = (countryCode) => {
  const flags = {
    'CN': '🇨🇳',
    'GB': '🇬🇧',
    'US': '🇺🇸',
    'RU': '🇷🇺'
  };
  return flags[countryCode] || '🏳️';
};

// 时钟显示模块（数字管）
function DigitalTube({ id, value }) {
  return (
    <div className="digital-tube">
      {value}
    </div>
  );
}

// api抓取网页天气数据
const fetchWeather = async (lat, lon) => {
  // 参数验证
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    throw new Error('经纬度必须是数字');
  }
  
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error('无效的经纬度范围');
  }
  
  try {
    const apiUrl = `https://q83qqqdytp.re.qweatherapi.com/v7/weather/now?location=${lon},${lat}&key=e9e30a09d6224cda9ccd3228b737747d`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // 检查API返回的状态码
    if (data.code !== '200') {
      throw new Error(`API返回错误: ${data.code} - ${data.message || '未知错误'}`);
    }
    
    return data;
    
  } catch (error) {
    console.error('获取天气数据时发生错误:', error);
    throw error;
  }
};

// 城市天气卡片组件
function CityWeatherCard({ city, isActive, onClick }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWeather = async () => {
      try {
        setLoading(true);
        const weatherData = await fetchWeather(city.lat, city.lon);
        setWeather(weatherData);
        setError(null);
      } catch (err) {
        setError(err.message);
        setWeather(null);
      } finally {
        setLoading(false);
      }
    };

    loadWeather();
    
    const intervalId = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [city.lat, city.lon]);

  return (
    <button
      className={`city-button ${isActive ? 'active' : ''}`}
      onClick={() => onClick(city)}
    >
      <div className="city-card">
        <div className="city-flag"><span>{getCountryFlag(city.countryCode)}</span></div>
        <div className="city-name"><span>{city.chineseName}</span></div>
        <div className="city-timezone">
          <span>UTC{city.timezone >= 0 ? `+${city.timezone}` : city.timezone}</span>
        </div>
        <div className="city-time">
          <span>{getCurrentTimeForCity(city.timezone)}</span>
        </div>
        
        {loading ? (
          <div className='weather-loading'>天气加载中...</div>
        ) : error ? (
          <div className='weather-error'>天气获取失败</div>
        ) : weather ? (
          <>
            <div className='weather'><span>{weather.now?.text || '未知'}</span></div>
            <div className='temperature'><span>{weather.now?.temp}°C</span></div>
            <div className='weather-details'>
              <span>湿度: {weather.now?.humidity}%</span>
              </div>
            <div className='weather-details'>
              <span>风力: {weather.now?.windScale}级</span>
            </div>
          </>
        ) : null}
      </div>
    </button>
  );
}

function App() {
  const [mode, setMode] = useState(true);
  const [time, setTime] = useState(provideTime());
  const [activeCity, setActiveCity] = useState('北京');
  
  // 四个世界主要城市及其时区信息
  const worldCities = [
    { 
      name: '北京', 
      chineseName: '北京',
      lat: 39.9042, 
      lon: 116.4074,
      timezone: 8,
      country: '中国',
      countryCode: 'CN'
    },
    { 
      name: 'London', 
      chineseName: '伦敦',
      lat: 51.5074, 
      lon: -0.1278,
      timezone: 0,
      country: '英国',
      countryCode: 'GB'
    },
    { 
      name: 'New York', 
      chineseName: '纽约',
      lat: 40.7128, 
      lon: -74.0060,
      timezone: -5,
      country: '美国',
      countryCode: 'US'
    },
    { 
      name: 'Moscow', 
      chineseName: '莫斯科',
      lat: 55.7558, 
      lon: 37.6173,
      timezone: 3,
      country: '俄罗斯',
      countryCode: 'RU'
    }
  ];

  // 处理城市点击
  const handleCityClick = (city) => {
    setActiveCity(city.name);
  };

  // 根据活跃城市更新时间
  useEffect(() => {
    const activeCityData = worldCities.find(city => city.name === activeCity);
    const timezoneOffset = activeCityData ? activeCityData.timezone : 8;
    
    const timerId = setInterval(() => {
      setTime(provideTime(timezoneOffset));
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [activeCity]);

  return (
    <div className={`App ${mode ? "dark-mode" : "light-mode"}`}>
      <div className="web">
        <div className="header">
          <h1>Clock App</h1>
          <div className="theme-toggle-wrapper">
            <a href='https://space.bilibili.com/448733562?spm_id_from=333.1007.0.0'
               target='_blank'
               rel="noopener noreferrer">
              <span className='link-us'>关于我们</span>
            </a>
            <label className='switch'>
              <input 
                type="checkbox" 
                checked={mode}
                onChange={() => setMode(!mode)} 
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
        
        <div className='body'> 
          
          {/* 主时钟显示 */}
          <div className='main-timer-container'>
            <div className='timer-container'>
              <DigitalTube id='Tube1' value={time[0]}/>
              <DigitalTube id='Tube2' value={time[1]}/>
              <div className='colon'><span>:</span></div>
              <DigitalTube id='Tube3' value={time[2]}/>
              <DigitalTube id='Tube4' value={time[3]}/>
              <div className='colon'><span>:</span></div>
              <DigitalTube id='Tube5' value={time[4]}/>
              <DigitalTube id='Tube6' value={time[5]}/>
            </div>
          </div>
          
          {/* 显示当前选中的城市信息 */}
          <div className='current-city-info'>
            <span>{worldCities.find(city => city.name === activeCity)?.chineseName}</span>
            <div className='city-details'>
              <span className='country-flag'>
                {getCountryFlag(worldCities.find(city => city.name === activeCity)?.countryCode)}
              </span>
              <span className='timezone'>
                UTC{worldCities.find(city => city.name === activeCity)?.timezone >= 0 ? 
                  `+${worldCities.find(city => city.name === activeCity)?.timezone}` : 
                  worldCities.find(city => city.name === activeCity)?.timezone}
              </span>
            </div>
          </div>

          {/* 四个城市按钮 */}
          <div className="world-cities-container">
            {worldCities.map((city, index) => (
              <CityWeatherCard
                key={index}
                city={city}
                isActive={activeCity === city.name}
                onClick={handleCityClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;