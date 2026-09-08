const FilteredImageSvg = ({ size = 64, ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 427 427" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      <g filter="url(#filter0_f_109_126)">
        <path d="M420.1 420.1H6.1001V6.09998H420.1V420.1Z" fill="url(#pattern0_109_126)"/>
      </g>
      <defs>
        <filter id="filter0_f_109_126" x="9.77516e-05" y="-2.43187e-05" width="426.2" height="426.2" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feGaussianBlur stdDeviation="3.05" result="effect1_foregroundBlur_109_126"/>
        </filter>
        <pattern id="pattern0_109_126" patternContentUnits="objectBoundingBox" width="1" height="1">
          <use xlinkHref="#image0_109_126" transform="translate(-0.0011006 -0.0548835) scale(0.002)"/>
        </pattern>
        <image id="image0_109_126" width="500" height="500" preserveAspectRatio="none" xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAYAAADL1t+KAAAQAElEQVR4AexdB2BkVdU+95WpmfTNZrN92UrZQu8dKSqIdBEUUEHp/CBiW0EBQVGkKKBIk46A9CZtC72zbO/JbnqbPvPeu/93bnZitqdnJnmTd+b2du6957vn3JmJRu7L5cAg4YAYJONwh+FyoK844O6RvuJsdtTrAvq25sFd/dviDlGW8UeS+3I54HJgWxxw98i2uJP7aX0L6LnOnyG5+ruA0kOSP7m+qN3+uxxwOTBYOeAC+mCd2W6Py0XpbrPOLehywOWAy4EB5EAuA/oAss1t2uWAy4HtcUBK2QVzz/Zqc9NdDrgc2B4HXEDfHoc6prviqSM3XL/LgW1yQAjhmnu2ySE30eVA73LABfSt8XNL8a542hJX3LjtcsA9CW6XRW4GlwMuB3rMARfQe8xCtwKXA9vjgHsS3B6H3HSXAy4Hes4BF9B7zsPu1OCWcTngcsDlgMsBlwO9yoEBAfTcNEDmZq97dbV0qMz9wFMHZrhelwMuB/wDkNsC/sU2R3AAAAAElFTkSuQmCC"/>
      </defs>
    </svg>
  );
};

export default FilteredImageSvg;