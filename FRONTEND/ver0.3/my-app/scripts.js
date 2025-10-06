'use strict'
const e = React.createElement;

class Menu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          clicked: false,
          content: ""
        };
        
    }

    toggleMenu = () => {
        this.setState(prevState => ({
            active: !prevState.active
        }));
    }

    render() {
        return (
            <div className="menu-container">
                <button className="menu-button" onClick={ () => this.props.setContent("todo")}>TODO</button>
                <button className="menu-button" onClick={ () => this.props.setContent("schedule")}>Расписание</button>
                <button className="menu-button" onClick={ () => this.props.setContent("jsx-calc")}>JSX_calc</button>
                <button className="menu-button" onClick={ () => this.props.setContent("student_calc")}>Student calc</button>

                <button className="menu-button" onClick={ () => this.props.setContent("name_form")}>name_form</button>

                
                <button className="menu-button" onClick={ () => this.props.setContent("student_search")}>stud_search</button>
            </div>
        );
    }
}

class TodoApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: [],
      currentTask: "",
      deleted: false
    };
  }

  handleInputChange = (e) => {
    this.setState({ currentTask: e.target.value });
  }

  addTask = () => {
    if (this.state.currentTask.trim() !== "") {
      this.setState((prevState) => ({
        tasks: [...prevState.tasks, prevState.currentTask],
        currentTask: ""
      }));
    }
  }


  deleteTask = (index) => {
    this.setState((prevState) => ({
      tasks: prevState.tasks.filter((task, i) => i !== index)
    }));
  }

  render() {
    return (
      <>
        <div className="task">
          <div className="task-button-wrap">
            <button className="task-button" onClick={this.addTask}>+</button>
          </div>
          <input
            className="task-inp"
            type="text"
            placeholder="Новая заметка"
            maxLength="46"
            value={this.state.currentTask}
            onChange={this.handleInputChange}
          />
        </div>

        <>
          {this.state.tasks.map((task, index) => (
            <div key={index} className="task">
              <div className="task-button-wrap">
                <button className="task-button" onClick={() => this.deleteTask(index)}>-</button>
              </div>
              <input
                className="task-inp"
                type="text"
                value={task}
                readOnly
              />
            </div>
          ))}
        </>
      </>
    );
  }
}


class ScheduleApp extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
        days: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница']
      }
  }

  
  render() {
    return (
      <>
        {this.state.days.map((item, index) => (
          <div className="schedule-day" key={index}>
            <table className="sсhedule-table">
                <tbody>
                  <tr>
                      <td rowSpan="4">{item}</td>
                      <td>Часы</td>
                      <td></td>
                      <td>Ауд.</td>
                  </tr>

                  <tr>
                      <td>08:30 - 10:00</td>
                      <td>Моделирование процессов и систем, Петров В.В.</td>
                      <td>102</td>
                  </tr>

                  <tr>
                      <td>10:10 - 11:40</td>
                      <td>Моделирование процессов и систем, Петров В.В.</td>
                      <td>102</td>
                  </tr>

                  <tr>
                      <td>12:10 - 13:40</td>
                      <td>Технологии обработки информации, Петров В.В.</td>
                      <td>102</td>
                  </tr>
                </tbody>
            </table>
          </div>
        ))}
      </>
    );
  }
}

class JSXcalc extends React.Component {
  render(){
    const userClassName = "user-info";
    const styleObj = {
      color: 'green',
      fonrFamily: 'Verdana',
      fontSize: 30
    };

    const user = {
      id: 5,
      age: 20,
      firstName: 'Ivan',
      lastName: 'Ivanov',
      getFullName: function(){
        return `${this.firstName} ${this.lastName}`
      }
    }

    return (
      <>
        <div className={userClassName} style={styleObj}>
          <p>Полное имя: {user.getFullName()}</p>
          <p>Возраст: {user.age}</p>
        </div>      
      </>
    );
  }
}

class StudentCalc extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
          serviceType: "consultation",
          hours: 1,
          rate: 500,
          totalCost: 0
      };
  }

  handleServiceChange = (e) => {
      const service = e.target.value;
      let rate = 500;
      if (service === "consultation") {
          rate = 500;
      } else if (service === "projectHelp") {
          rate = 700;
      } else if (service === "tutoring") {
          rate = 600;
      }
      this.setState({ serviceType: service, rate });
  };

  handleHoursChange = (e) => {
      const hours = parseInt(e.target.value);
      this.setState({ hours });
  };

  calculateCost = () => {
      const { hours, rate } = this.state;
      const totalCost = hours * rate;
      this.setState({ totalCost });
  };

  render() {
      return (
          <div className="student-calc">
              <h3>Калькулятор студенческих услуг</h3>
              <div>
                  <label>
                      Выберите услугу:
                      <select value={this.state.serviceType} onChange={this.handleServiceChange}>
                          <option value="consultation">Консультация</option>
                          <option value="projectHelp">Помощь с проектом</option>
                          <option value="tutoring">Репетиторство</option>
                      </select>
                  </label>
              </div>
              <div>
                  <label>
                      Количество часов:
                      <input 
                          type="number" 
                          value={this.state.hours} 
                          onChange={this.handleHoursChange} 
                          min="1" 
                      />
                  </label>
              </div>
              <div>
                  <button onClick={this.calculateCost}>Рассчитать стоимость</button>
              </div>
              <div>
                  <p>Стоимость: {this.state.totalCost} руб.</p>
              </div>
          </div>
      );
  }
}

//PR4_TASK1
const { useState } = React;
const { useEffect } = React;
const { useRef } = React;
function NameForm12(){

  const [value1, setValue1] = useState("");
  const [value2, setValue2] = useState("Напишите сочининение о вашем любимом DOM-элементе");
  const [value3, setValue3] = useState("Кокос");

  const handleSubmit = event => {
    alert('Отправленное имя: ' + value1);
    alert('Сочинение отправлено: ' + value2);
    alert('Ваш любимый вкус: ' + value3);
    event.preventDefault();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="form1">
      <label>
        Имя:
        <input type="text" value={value1} onChange={event => setValue1(event.target.value)} />
        Сочинение:
        <textarea value={value2} onChange={event => setValue2(event.target.value)} />
          Выберите ваш любимый вкус:
          <select value={value3} onChange={event => setValue3(event.target.value)}>
            <option value="Грейпфрукт">Грейпфрукт</option>
            <option value="Лайм">Лайм</option>
            <option value="Кокос">Кокос</option>
            <option value="Манго">Манго</option>
          </select>

        <input type="submit" value="отправить" />
      </label>
    </form>
    </div>
  );

}

function NameFormFIRST({name: name_, age: age_}){

  const [name, setName] = useState(name_ || "");
  const [nameIsValid, setNameValid] = useState(false);

  const [age, setAge] = useState(age_ || 0);
  const [ageIsValid, setAgeValid] = useState(false);

  const validateAge = () => age>=0;
  const validateName = () => name.length>2;

  const onAgeChange = event => {
    let val = event.target.value;
    setAge(val);
    setAgeValid(validateAge(val));
  };
  const onNameChange = event => {
    let val = event.target.value;
    console.log(val);
    setName(val);
    setNameValid(validateName(val));
  };

  const handleSubmit = event => {
    event.preventDefault();
    if(nameIsValid && ageIsValid) {

      alert('Имя: ' + name + '\nВозраст: ' + age);

    }
  };

  return(
    <div>
      <form onSubmit={handleSubmit} className="form1">
        <p>
          <label>Имя: </label><br />
          <input type="text" value={name} onChange={onNameChange} style={{borderColor: nameIsValid ? "green" : "red"}} />
        </p>

        <p>
          <label>Возраст: </label><br />
          <input type="text" value={age} onChange={onAgeChange} style={{borderColor: ageIsValid ? "green" : "red"}} />
        </p>
        <input type="submit" value="Отправить" />
      </form>
    </div>
  );

}

function NameForm({ name: name_, age: age_ }) {
  const nameRef = useRef(null);
  const ageRef = useRef(null);

  const [nameIsValid, setNameValid] = useState(false);
  const [ageIsValid, setAgeValid] = useState(false);

  const validateAge = (val) => val >= 0;
  const validateName = (val) => val.length > 2;

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = nameRef.current.value;
    const age = ageRef.current.value;

    const isNameValid = validateName(name);
    const isAgeValid = validateAge(age);

    setNameValid(isNameValid);
    setAgeValid(isAgeValid);

    if (isNameValid && isAgeValid) {
      alert(`Имя: ${name}\nВозраст: ${age}`);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="form1">
        <p>
          <label>Имя: </label><br />
          <input type="text" ref={nameRef} style={{ borderColor: nameIsValid ? "green" : "red" }} />
        </p>

        <p>
          <label>Возраст: </label><br />
          <input type="text" ref={ageRef} style={{ borderColor: ageIsValid ? "green" : "red" }} />
        </p>
        <input type="submit" value="Отправить" />
      </form>
    </div>
  );
}



function StudForm({searchValue, handleSearch}){

  return (
    <>
      <form className="form1">
        <p>
          <label>Введите название предмета/дату сдачи: </label><br />
          <input type="text" value={searchValue} onChange={handleSearch} placeholder="Например, СТООП программа" />
        </p>
      </form>
    </>
  );

}

function TasksList({filtered}){

  return (
    <ul>
        {filtered.length != 0 ? (
          filtered.map((item) => <li key={item.id}>Название: {item.name}<br />Дата сдачи: {item.date}</li>)
        ) : (
          <li className="notFound">Ничего не найдено</li>
        )}
      </ul>
  );

}


function StudSearch(){


  const tasksData = [
    {id: 1, name: "СТООП программа", date: "2024-12-15"},
    {id: 2, name: "ТСВР ПР5", date: "2024-12-12"},
    {id: 3, name: "СТИП ПР4", date: "2024-12-13"},
    {id: 4, name: "ММТ ПР4", date: "2024-12-11"},
  ];


  const [searchValue, setSearchValue] = useState("");
  const [filtered, setFiltered] = useState(tasksData);


  const handleSubmit = event => {};

  const handleSearch = event => {
    event.preventDefault();
    setSearchValue(event.target.value);
  };

  useEffect(() => {
    if(!searchValue) setFiltered(tasksData);
    else setFiltered(tasksData.filter((item) => item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.date.includes(searchValue)));
  }, [searchValue]);

  

  return (
    <div>
      <StudForm searchValue={searchValue} handleSearch={handleSearch} />
      <TasksList filtered={filtered} />
    </div>
  );

}



/*class App extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
          currentContent: "todo",
      };
  }

  setCurrentContent = (content) => {
      this.setState({ currentContent: content });
  };

  renderContent() {
      switch (this.state.currentContent) {
          case "todo":
              return <TodoApp />;
          case "schedule":
              return <ScheduleApp />;
          case "jsx-calc":
            return <JSXcalc />;
          case "student_calc":
            return <StudentCalc />
          case "name_form":
            return <NameForm name="Вася" age={300} />
          case "student_search":
            return <StudSearch />
          default:
              return <TodoApp />;
      }
  }

  render() {
      return (
          <div>
              <Menu setContent={this.setCurrentContent} />
              <div className="content-container">
                  {this.renderContent()}
              </div>
          </div>
      );
  }
}
*/

function SignIn(){
  return <div>
    <form>
      <label htmlFor="login">Логин</label>
      <input type="text" placeholder="login" />

      <label htmlFor="passwd">Пароль</label>
      <input type="password" placeholder="password" />

      <input type="submit" value="Войти" />
    </form>
  </div>
}

function SignUp(){
  return <div>
    <form>
      <label htmlFor="login">Логин</label>
      <input type="text" placeholder="login" />

      <label htmlFor="passwd">Пароль</label>
      <input type="password" placeholder="password" />

      <label htmlFor="passwd">Повторите пароль</label>
      <input type="password" placeholder="password" />

      <input type="submit" value="Зарегистрироваться" />
    </form>
  </div>
}

function RegisterPage(){
  return
}


function App(){
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  return <SignUp />;
}
ReactDOM.render(<App />, document.querySelector('.app-container'));
  
