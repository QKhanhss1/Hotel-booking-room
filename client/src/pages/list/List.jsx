import "./list.css";
import Navbar from "../../components/navbar/Navbar";
import Header from "../../components/header/Header";
import { SearchContext } from "../../context/SearchContext";
import { useState, useContext ,useEffect} from "react";
import { format } from "date-fns";
import { DateRange } from "react-date-range";
import SearchItem from "../../components/searchItem/SearchItem";
import useFetch from "../../hooks/useFetch";

const List = () => {
  const { destination, dates, options, dispatch } = useContext(SearchContext);
  const [openDate, setOpenDate] = useState(false);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(999);


  const { data, loading, error, reFetch } = useFetch(
    `/hotels?city=${destination}&min=${min}&max=${max}`
  );

  const handleDestinationChange = (e) => {
    dispatch({ type: "UPDATE_DESTINATION", payload: e.target.value });
  };

  const handleDateChange = (item) => {
    dispatch({ type: "UPDATE_DATES", payload: [item.selection] });
  };

  const handleClick = () => {
    //kiểm tra giá
    console.log("Min Price:", min);
    console.log("Max Price:", max);
    // Tùy chọn kiểm tra giá min và max
    if (min > max) {
      alert("Giá tối thiểu không thể lớn hơn Giá tối đa");
      return;
    }
    reFetch();
  };

  return (
    <div>
      <Navbar />
      <Header type="list" />
      <div className="listContainer">
        <div className="listWrapper">
          <div className="listSearch">
            <h1 className="lsTitle">Tìm kiếm</h1>
            <div className="lsItem">
              <label>Nơi đến</label>
              <input
                value={destination}
                onChange={handleDestinationChange}
                type="text"
              />
            </div>
            <div className="lsItem">
              <label>Ngày nhận phòng</label>
              <span onClick={() => setOpenDate(!openDate)}>{`${format(
                dates[0].startDate,
                "MM/dd/yyyy"
              )} to ${format(dates[0].endDate, "MM/dd/yyyy")}`}</span>
              {openDate && (
                <DateRange
                  onChange={handleDateChange}
                  minDate={new Date()}
                  ranges={dates}
                />
              )}
            </div>
            <div className="lsItem">
              <label>Tùy chọn</label>
              <div className="lsOptions">
                <div className="lsOptionItem">
                  <span className="lsOptionText">Giá tối thiểu <small>mỗi đêm</small></span>
                  <input
                    type="number"
                    onChange={(e) => setMin(e.target.value)}
                    className="lsOptionInput"
                  />
                </div>
                <div className="lsOptionItem">
                  <span className="lsOptionText">Giá tối đa <small>mỗi đêm</small></span>
                  <input
                    type="number"
                    onChange={(e) => setMax(e.target.value)}
                    className="lsOptionInput"
                  />
                </div>
                <div className="lsOptionItem">
                  <span className="lsOptionText">Người lớn</span>
                  <input
                    type="number"
                    min={1}
                    className="lsOptionInput"
                    placeholder={options.adult}
                  />
                </div>
                <div className="lsOptionItem">
                  <span className="lsOptionText">Trẻ em</span>
                  <input
                    type="number"
                    min={0}
                    className="lsOptionInput"
                    placeholder={options.children}
                  />
                </div>
                <div className="lsOptionItem">
                  <span className="lsOptionText">Phòng</span>
                  <input
                    type="number"
                    min={1}
                    className="lsOptionInput"
                    placeholder={options.room}
                  />
                </div>
              </div>
            </div>
            <button onClick={handleClick}>Tìm kiếm</button>
          </div>
          <div className="listResult">
            {loading ? (
              "loading"
            ) : (
              <>
                {Array.isArray(data) && data.length > 0 ? (
                  data.map((item) => <SearchItem item={item} key={item._id} />)
                ) : (
                  <p>Không tìm thấy kết quả</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default List;
