import React from 'react';
import HotelCard from './HotelCard';

function HotelList({ hotels, handleHotelClick, startEditing, handleDelete ,availableAmenities }) {
    return (
        <div className="Room w-full max-w-full mx-auto px-2 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-8 auto-rows-fr">
                {hotels.map((hotel) => (
                    <HotelCard
                        key={hotel._id}
                        hotel={hotel}
                        handleHotelClick={handleHotelClick}
                        startEditing={startEditing}
                        handleDelete={handleDelete}
                        availableAmenities={availableAmenities}
                    />
                ))}
            </div>
        </div>
    );
}

export default HotelList;